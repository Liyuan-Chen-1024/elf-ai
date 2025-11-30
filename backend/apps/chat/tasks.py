import json
import time
import httpx

from django.conf import settings
from django.db import transaction

from celery import shared_task
from openai import OpenAI

from apps.core.logging import get_logger

from .models import Message, Memory, Conversation

logger = get_logger(__name__)


def get_llm_client():
    """Initialize OpenAI client with custom http_client to control SSL verification"""
    http_client = httpx.Client(verify=settings.LLM_VERIFY_SSL)
    return OpenAI(
        base_url=settings.LLM_API_URL,
        api_key=settings.LLM_API_KEY or "not-needed",
        http_client=http_client,
    )


@shared_task  # type: ignore
def update_conversation_summary_task(conversation_id: str) -> None:
    """
    Generate or update a concise summary of the conversation.
    """
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        messages = conversation.messages.order_by("created_at")
        
        if not messages.exists():
            return

        # Prepare transcript for summarization
        transcript = ""
        for msg in messages:
            role = "User" if msg.role == "user" else "Agent"
            if msg.role == "system": continue
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
            logger.info(f"Updated summary for conversation {conversation_id}: {summary}")

    except Exception as e:
        logger.exception(f"Error updating summary for conversation {conversation_id}: {e}")


@shared_task  # type: ignore
def extract_memories_task(user_id: str, message_content: str) -> None:
    """
    Analyze user message and update the structured user memory profile.
    """
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
            response_format={"type": "json_object"}
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

            # Update status to show we're processing
            with transaction.atomic():
                ai_message.status_generating = "Generating response..."
                ai_message.save(update_fields=["status_generating"])

            # Prepare system prompt with memory profile
            try:
                memory_profile = Memory.objects.get(user=user)
                memory_context = json.dumps(memory_profile.data, indent=2)
            except Memory.DoesNotExist:
                memory_context = "{}"

            # Fetch summaries of past conversations (excluding current one)
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

            # Fetch conversation history (last 20 messages to be safe)
            # We exclude the current AI message being generated
            recent_messages = (
                Message.objects.filter(conversation=ai_message.conversation)
                .exclude(id=ai_message.id)
                .order_by("-created_at")[:20]
            )

            # Construct history text
            history_text = ""
            fetched_messages = list(reversed(recent_messages))

            # Avoid duplication: If the current message is already in the fetched history, remove it.
            if fetched_messages and fetched_messages[-1].content == message_content and fetched_messages[-1].role == "user":
                fetched_messages.pop()
                logger.info("Removed current user message from history text to avoid duplication")

            for msg in fetched_messages:
                role = "Agent" if msg.role == "agent" else "User"
                if msg.role == "system":
                    role = "System"
                history_text += f"{role}: {msg.content}\n"

            from django.utils import timezone
            
            current_date = timezone.now().strftime("%Y-%m-%d")
            
            system_prompt = (
                f"Today's date is {current_date}.\n"
                "You are ElfAI, an advanced AI assistant with persistent memory.\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. You have full access to the conversation history, user profile, AND summaries of past conversations. ACT LIKE IT.\n"
                "2. NEVER claim you cannot remember past discussions. Refer to the 'PAST CONVERSATIONS SUMMARY' section.\n"
                "3. Treat the 'Current User Profile' and 'Current Conversation History' as your own memory.\n"
                "4. If asked about a previous topic (e.g. 'when we talked about TCP'), check the Past Summaries.\n\n"
                "CURRENT USER PROFILE (Long-term Memory):\n"
                f"{memory_context}\n\n"
                f"{past_summaries_text}"
                "CURRENT CONVERSATION HISTORY:\n"
                f"{history_text}\n\n"
                "Use the above information to answer naturally."
            )

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message_content}
            ]

            # Make the request to OpenAI compatible API
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                temperature=0.7,
            )

            accumulated_content = ""
            last_update_time = time.time()

            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    accumulated_content += content

                    # Update DB every 0.5s or every 50 chars
                    current_time = time.time()
                    if current_time - last_update_time > 0.5:
                        ai_message.content = accumulated_content
                        ai_message.save(update_fields=["content"])
                        last_update_time = current_time

                        # Update status occasionally
                        if len(accumulated_content) % 100 == 0:
                            ai_message.status_generating = "Still generating..."
                            ai_message.save(update_fields=["status_generating"])

            # Final update with full content
            ai_message.content = accumulated_content
            ai_message.is_generating = False
            ai_message.status_generating = "Completed"
            ai_message.save(
                update_fields=["content", "is_generating", "status_generating"]
            )
            
            # Trigger summary update again after response is complete to include AI's answer
            update_conversation_summary_task.delay(str(ai_message.conversation.id))

            logger.info("Successfully generated AI response")

        except Exception as e:
            logger.exception(
                f"Error generating AI response for message {ai_message_id}"
            )
            # Update message to indicate error
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
