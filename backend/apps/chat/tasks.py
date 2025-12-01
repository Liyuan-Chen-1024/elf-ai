import re
import json
import time
from typing import Any, Dict, List

from django.conf import settings
from django.db import transaction
from django.utils import timezone

import httpx
from celery import shared_task
from openai import OpenAI

from apps.core.logging import get_logger

from .models import Conversation, Memory, Message
from .tools import registry

logger = get_logger(__name__)


def get_llm_client() -> OpenAI:
    """Initialize OpenAI client with custom http_client to control SSL verification."""
    http_client = httpx.Client(verify=settings.LLM_VERIFY_SSL)
    return OpenAI(
        base_url=settings.LLM_API_URL,
        api_key=settings.LLM_API_KEY or "not-needed",
        http_client=http_client,
    )


def format_links_to_markdown(text: str) -> str:
    """
    Fix common link formatting issues in LLM output.
    
    Converts:
    1. '* Title (URL)' -> '* [Title](URL)'
    2. '* **Title** (URL)' -> '* [**Title**](URL)'
    3. 'Title (URL)' -> '[Title](URL)' (when it looks like a list item)
    """
    # Pattern to match list items with parenthesized URLs
    pattern = re.compile(r'^(\s*[-*•]\s+)(.*?)\s+\((https?://[^\)]+)\)$', re.MULTILINE)
    
    def replacement(match):
        prefix = match.group(1)
        title = match.group(2).strip()
        url = match.group(3).strip()
        
        # If title is already a markdown link, don't touch it
        if '[' in title and ']' in title:
            return match.group(0)
            
        return f"{prefix}[{title}]({url})"

    return pattern.sub(replacement, text)


@shared_task  # type: ignore
def update_conversation_summary_task(conversation_id: str) -> None:
    """Generate or update a concise summary of the conversation."""
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        messages = conversation.messages.order_by("created_at")

        if not messages.exists():
            return

        # Prepare transcript for summarization
        transcript = ""
        for msg in messages:
            role = "User" if msg.role == "user" else "Agent"
            if msg.role == "system":
                continue
            transcript += f"{role}: {msg.content}\n"

        client = get_llm_client()
        model = settings.LLM_MODEL_NAME or "default"

        logger.info(f"Updating summary for conversation {conversation_id}")

        prompt = f"""
Summarize the following conversation in 1-2 sentences. Focus on the main topic and key outcomes.
Keep it concise (e.g., "User asked about Python asyncio. Agent explained async/await syntax.").

Conversation:
{transcript}
"""

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )

        summary = response.choices[0].message.content
        if summary:
            conversation.summary = summary.strip()
            conversation.save(update_fields=["summary"])
            logger.info(
                f"Updated summary for conversation {conversation_id}: {summary}"
            )

    except Exception as e:
        logger.exception(
            f"Error updating summary for conversation {conversation_id}: {e}"
        )


@shared_task  # type: ignore
def extract_memories_task(user_id: str, message_content: str) -> None:
    """Analyze user message and update the structured user memory profile."""
    try:
        client = get_llm_client()
        model = settings.LLM_MODEL_NAME or "default"

        # Fetch or create single memory profile
        memory_profile, created = Memory.objects.get_or_create(user_id=user_id)
        current_data = memory_profile.data

        logger.info(f"Updating memory profile for user {user_id}")

        extraction_prompt = f"""
You are a memory manager for an AI assistant. You maintain a structured profile of the user.

User message: "{message_content}"

Current Profile JSON:
{json.dumps(current_data, indent=2)}

Task:
1. Update the Current Profile based on the User message.
2. Maintain a structured JSON with keys like "personal_details", "interests", "preferences", "travel_plans", etc.
3. Add new facts, update changed facts, and remove obsolete ones.
4. IGNORE transient/temporary states (e.g. "I'm hungry now").
5. Keep it concise.
6. Return ONLY the updated JSON object.

Example Output Structure:
{{
  "personal_details": {{ "name": "Alice", "age": 30 }},
  "interests": ["Hiking", "Coding"],
  "preferences": {{ "diet": "Vegetarian" }}
}}
"""

        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": extraction_prompt}],
            temperature=0.0,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        if content:
            try:
                new_data = json.loads(content)
                # Save the updated profile
                memory_profile.data = new_data
                memory_profile.save()
                logger.info(f"Updated memory profile for user {user_id}")

            except json.JSONDecodeError:
                logger.error(f"Failed to parse memory profile JSON: {content}")

    except Exception as e:
        logger.exception(f"Error extracting memories for user {user_id}: {e}")


@shared_task  # type: ignore
def generate_agent_response(message_content: str, ai_message_id: str) -> None:
    """
    Generate AI response for a message and update the AI message content.
    Supports tool usage and multi-turn reasoning.
    """
    try:
        # Get the AI message
        ai_message = Message.objects.get(id=ai_message_id, role="agent")
        user = ai_message.conversation.user

        # Trigger memory extraction in background
        extract_memories_task.delay(str(user.id), message_content)

        # Trigger summary update in background
        update_conversation_summary_task.delay(str(ai_message.conversation.id))

        try:
            # Update initial status
            with transaction.atomic():
                ai_message.status_generating = "Connecting to AI service..."
                ai_message.save(update_fields=["status_generating"])

            client = get_llm_client()
            model = settings.LLM_MODEL_NAME or "default"

            logger.info(
                f"Sending request to LLM API: {settings.LLM_API_URL} "
                f"with model {model}"
            )

            # Prepare context (Memory + Summary + History)
            try:
                memory_profile = Memory.objects.get(user=user)
                memory_context = json.dumps(memory_profile.data, indent=2)
            except Memory.DoesNotExist:
                memory_context = "{}"

            # Past Summaries
            past_conversations = (
                Conversation.objects.filter(user=user)
                .exclude(id=ai_message.conversation.id)
                .exclude(summary="")
                .order_by("-updated_at")[:10]
            )

            past_summaries_text = ""
            if past_conversations.exists():
                past_summaries_text = "PAST CONVERSATIONS SUMMARY:\n"
                for conv in past_conversations:
                    date_str = conv.updated_at.strftime("%Y-%m-%d")
                    past_summaries_text += f"- [{date_str}]: {conv.summary}\n"
                past_summaries_text += "\n"

            # Recent History
            recent_messages = (
                Message.objects.filter(conversation=ai_message.conversation)
                .exclude(id=ai_message.id)
                .order_by("-created_at")[:20]
            )

            history_text = ""
            fetched_messages = list(reversed(recent_messages))

            if (
                fetched_messages
                and fetched_messages[-1].content == message_content
                and fetched_messages[-1].role == "user"
            ):
                fetched_messages.pop()
                logger.info("Removed current user message from history text")

            for msg in fetched_messages:
                role = "Agent" if msg.role == "agent" else "User"
                if msg.role == "system":
                    role = "System"
                history_text += f"{role}: {msg.content}\n"

            current_date = timezone.now().strftime("%Y-%m-%d")

            system_prompt = (
                f"Today's date is {current_date}.\n"
                "You are ElfAI, an advanced AI assistant with persistent memory and tool capabilities.\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. You have full access to history, memory, and TOOLS. Use them!\n"
                "2. DIRECT ACTION: Do not explain what you are going to do. If you need info, CALL THE TOOL IMMEDIATELY.\n"
                "3. Do not output a text plan. Just execute the search or fetch.\n"
                "4. If you need to search, use 'web_search'. If you need to read a URL, use 'web_fetch'.\n"
                "5. SEARCH STRATEGY:\n"
                "   - Start with specific KEYWORDS.\n"
                "   - If search results contains a promising URL, USE 'web_fetch' TO READ IT immediately.\n"
                "   - DO NOT keep searching for the same thing over and over. Read the available content!\n"
                "   - If the first search fails, try synonyms or broader terms.\n"
                "6. CITATIONS & FORMATTING (STRICT):\n"
                "   - WHEN LISTING SEARCH RESULTS, NEWS, OR ARTICLES, YOU MUST INCLUDE THE URL.\n"
                "   - DO NOT output a list without links.\n"
                "   - CORRECT FORMAT: - **[Title of Page](https://example.com)**: Description here.\n"
                "   - INCORRECT FORMAT: - Title of Page (https://example.com)\n"
                "   - INCORRECT FORMAT: - Title of Page (no link)\n"
                "   - INCORRECT FORMAT: - **Title of Page** (https://example.com)\n"
                "   - NEVER SHOW THE RAW URL TEXT IN THE CHAT, HIDE IT BEHIND THE TITLE.\n"
                "   - If a URL is available in the tool output, USE IT.\n"
                "7. Treat the 'Current User Profile' and 'Current Conversation History' as your own memory.\n"
                "8. Answer naturally and directly once you have the information.\n\n"
                "CURRENT USER PROFILE (Long-term Memory):\n"
                f"{memory_context}\n\n"
                f"{past_summaries_text}"
                "CURRENT CONVERSATION HISTORY:\n"
                f"{history_text}\n\n"
            )

            messages: List[Dict[str, Any]] = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message_content},
            ]

            # Tool loop
            tools = registry.get_openai_tools()
            max_turns = 8  # Increased for better orchestration
            final_content = ""

            for turn in range(max_turns):
                logger.info(f"LLM Turn {turn+1}/{max_turns}")

                # Stream response
                response = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    tools=tools,
                    stream=True,
                    temperature=0.7,
                )

                tool_calls_buffer: Dict[int, Any] = {}
                content_buffer = ""
                last_update_time = time.time()

                for chunk in response:
                    delta = chunk.choices[0].delta

                    # Handle Content
                    if delta.content:
                        content_buffer += delta.content
                        # If final answer (no tool calls), stream it
                        if not tool_calls_buffer:
                            current_time = time.time()
                            # Update DB more frequently (every 0.1s) to make streaming smoother
                            if current_time - last_update_time > 0.1:
                                current_text = final_content + content_buffer
                                # Apply formatting to the current accumulated text so the user sees it live
                                formatted_text = format_links_to_markdown(current_text)
                                ai_message.content = formatted_text
                                ai_message.save(update_fields=["content"])
                                last_update_time = current_time

                    # Handle Tool Calls
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            if idx not in tool_calls_buffer:
                                tool_calls_buffer[idx] = {
                                    "id": tc.id,
                                    "type": "function",
                                    "function": {"name": "", "arguments": ""},
                                }

                            if tc.id:
                                tool_calls_buffer[idx]["id"] = tc.id

                            if tc.function:
                                if tc.function.name:
                                    tool_calls_buffer[idx]["function"][
                                        "name"
                                    ] += tc.function.name
                                if tc.function.arguments:
                                    tool_calls_buffer[idx]["function"][
                                        "arguments"
                                    ] += tc.function.arguments

                # End of stream for this turn
                if tool_calls_buffer:
                    # DO NOT append content_buffer (reasoning/thoughts) to final_content
                    # This prevents the user from seeing "I will now search for..."
                    # The thoughts ARE preserved in the 'messages' list below for the LLM's context.

                    # 1. Append assistant message with tool calls
                    assistant_msg = {
                        "role": "assistant",
                        "content": content_buffer or None,
                        "tool_calls": list(tool_calls_buffer.values()),
                    }
                    messages.append(assistant_msg)

                    # 2. Execute tools
                    for tc in tool_calls_buffer.values():
                        func_name = tc["function"]["name"]
                        args_str = tc["function"]["arguments"]
                        call_id = tc["id"]

                        # Update status to show detailed activity
                        # Note: This status is visible to the user
                        display_status = f"Using tool: {func_name}..."
                        if func_name == "web_search":
                            # Try to extract query for better UX
                            try:
                                q = json.loads(args_str).get("query", "")
                                if len(q) > 20:
                                    q = q[:20] + "..."
                                display_status = f"Searching web for: {q}"
                            except:
                                pass
                        elif func_name == "web_fetch":
                            display_status = "Reading website content..."

                        with transaction.atomic():
                            ai_message.status_generating = display_status
                            ai_message.save(update_fields=["status_generating"])

                        logger.info(f"Executing tool {func_name} with args {args_str}")

                        try:
                            tool = registry.get_tool(func_name)
                            if tool:
                                try:
                                    args = json.loads(args_str)
                                    result = tool.execute(**args)
                                except json.JSONDecodeError:
                                    result = f"Error: Invalid JSON args: {args_str}"
                            else:
                                result = f"Error: Tool {func_name} not found"
                        except Exception as e:
                            result = f"Error executing tool: {e}"

                        # 3. Append tool result
                        messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": call_id,
                                "content": str(result),
                            }
                        )

                    # We discard the content_buffer (reasoning) from the final user-facing message
                    # to keep the chat clean. The reasoning is preserved in 'messages' history for the LLM.
                    # We reset the DB content to what it was before this turn (final_content) so the
                    # "I need to search..." text disappears from the UI while the tool runs.
                    ai_message.content = final_content
                    ai_message.save(update_fields=["content"])

                    # Continue to next turn so LLM can use the tool output
                    continue

                # No tool calls - this is the final answer
                if content_buffer:
                    final_content += content_buffer

                # Apply post-processing formatting fix
                final_content = format_links_to_markdown(final_content)

                ai_message.content = final_content
                ai_message.is_generating = False
                ai_message.status_generating = "Completed"
                ai_message.save(
                    update_fields=[
                        "content",
                        "is_generating",
                        "status_generating",
                    ]
                )

                # Trigger summary update again
                update_conversation_summary_task.delay(str(ai_message.conversation.id))

                logger.info("Successfully generated AI response")
                break

        except Exception as e:
            logger.exception(
                f"Error generating AI response for message {ai_message_id}"
            )
            with transaction.atomic():
                ai_message.content = f"Error generating response: {str(e)}"
                ai_message.is_generating = False
                ai_message.status_generating = "Error occurred"
                ai_message.save(
                    update_fields=[
                        "content",
                        "is_generating",
                        "status_generating",
                    ]
                )
            raise

    except Message.DoesNotExist:
        logger.error(f"AI message {ai_message_id} not found")
        raise
