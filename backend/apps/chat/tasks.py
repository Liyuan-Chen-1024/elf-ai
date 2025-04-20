import asyncio
import json
import os
import time
from typing import Any, Dict, Generator

from django.conf import settings
from django.db import transaction

import aiohttp
from asgiref.sync import sync_to_async
from celery import shared_task

from apps.core.logging import get_logger

from .models import Message

logger = get_logger(__name__)


# Create synchronized versions of database operations
@sync_to_async
def update_message_content(message, content):
    """Update message content in a sync context"""
    message.content = content
    message.save(update_fields=["content"])


@sync_to_async
def update_message_status(message, status):
    """Update message status in a sync context"""
    message.status_generating = status
    message.save(update_fields=["status_generating"])


@sync_to_async
def update_message_content_and_status(message, content, status):
    """Update both content and status in a sync context"""
    message.content = content
    message.status_generating = status
    message.save(update_fields=["content", "status_generating"])


@sync_to_async
def complete_message(message):
    """Mark the message as complete in a sync context"""
    message.is_generating = False
    message.status_generating = "Completed"
    message.save(update_fields=["is_generating", "status_generating"])


async def stream_llm_response(url: str, payload: Dict[str, Any], ai_message) -> None:
    """
    Stream response from LLM API using aiohttp.

    Args:
        url: API endpoint URL
        payload: Request payload
        ai_message: Message object to update
    """
    accumulated_content = ""

    # Get basic auth credentials from environment variables
    username = settings.LLM_BASIC_AUTH_USERNAME
    password = settings.LLM_BASIC_AUTH_PASSWORD

    # Ensure stream is set to true for this function
    payload["stream"] = True

    # Set up auth and headers
    headers = {
        "Content-Type": "application/json",
    }

    # Log authentication info (safely)
    if username and password:
        auth = aiohttp.BasicAuth(username, password)
        logger.info(f"Using basic auth for LLM API with username: {username}")
    else:
        auth = None
        logger.error("No basic auth credentials found. Authentication will fail!")

    logger.info(f"Sending request to LLM API: {url}")

    # Create a dedicated session with the auth object
    async with aiohttp.ClientSession() as session:
        # Make authenticated request
        async with session.post(
            url, json=payload, headers=headers, auth=auth
        ) as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error(
                    f"LLM API error {response.status}: URL: {url}, Response: {error_text}"
                )
                raise Exception(f"API returned error: {response.status}, {error_text}")

            logger.info(
                "Successfully connected to LLM API, processing streaming response"
            )

            # Process the streaming response
            accumulated_content = ""
            full_response = ""  # Capture the entire API response as fallback

            async for line in response.content:
                print(line)
                if line:
                    # Parse the data
                    line_text = line.decode("utf-8")
                    full_response += line_text + "\n"  # Append to full response

                    # Skip "data: " prefix if present (common in SSE)
                    if line_text.startswith("data: "):
                        line_text = line_text[6:]

                    # Skip empty lines or "[DONE]" marker
                    if line_text == "[DONE]" or not line_text.strip():
                        continue

                    try:
                        # Parse JSON response
                        chunk_data = json.loads(line_text)

                        # Log the first chunk to understand format
                        if accumulated_content == "":
                            logger.info(
                                f"First response chunk format: {json.dumps(chunk_data)}"
                            )

                        # Handle different API response formats
                        content = None

                        # Standard OpenAI format
                        if "choices" in chunk_data and len(chunk_data["choices"]) > 0:
                            if "delta" in chunk_data["choices"][0]:
                                if "content" in chunk_data["choices"][0]["delta"]:
                                    content = chunk_data["choices"][0]["delta"][
                                        "content"
                                    ]

                        # Alternative OpenAI format (non-streaming)
                        elif "choices" in chunk_data and len(chunk_data["choices"]) > 0:
                            if "message" in chunk_data["choices"][0]:
                                if "content" in chunk_data["choices"][0]["message"]:
                                    content = chunk_data["choices"][0]["message"][
                                        "content"
                                    ]

                        # Simple text format (fallback)
                        elif "text" in chunk_data:
                            content = chunk_data["text"]

                        # Ollama format
                        elif "response" in chunk_data:
                            # This is the common Ollama format
                            content = chunk_data["response"]

                            # Special handling for Ollama initialization messages
                            if (
                                content == ""
                                and "done" in chunk_data
                                and chunk_data["done"]
                            ):
                                if chunk_data.get("done_reason") in ["load", "stop"]:
                                    logger.info(
                                        f"Received Ollama message with done_reason: {chunk_data.get('done_reason')}"
                                    )
                                    # This is an initialization or completion message, not actual content
                                    reason = chunk_data.get("done_reason", "unknown")

                                    if reason == "load":
                                        await update_message_status(
                                            ai_message, "Model is loading..."
                                        )
                                    elif reason == "stop":
                                        # This is the normal completion message, we should have content by now
                                        if accumulated_content:
                                            await update_message_status(
                                                ai_message, "Processing complete"
                                            )
                                        else:
                                            await update_message_status(
                                                ai_message, "No content generated"
                                            )
                                    continue

                        # Direct content format
                        elif "content" in chunk_data:
                            content = chunk_data["content"]

                        # If no format matched, log the chunk data
                        if content is None and accumulated_content == "":
                            logger.warning(
                                f"Unknown response format, raw chunk: {line_text}"
                            )
                            # Try to use the entire response as content if we can't parse it
                            try:
                                # Just use the raw text as a last resort
                                content = line_text
                            except:
                                pass

                        # Update the message content if we got new content
                        if content:
                            accumulated_content += content
                            # Update the message in the database using sync_to_async
                            await update_message_content(
                                ai_message, accumulated_content
                            )

                            # Update status occasionally to show progress
                            if len(accumulated_content) % 100 == 0:
                                await update_message_status(
                                    ai_message, "Still generating..."
                                )

                    except json.JSONDecodeError:
                        logger.warning(
                            f"Could not parse API response as JSON: {line_text}"
                        )

            # After processing all chunks, check if we got any content
            if accumulated_content == "":
                logger.warning(
                    "No content was extracted from any chunks, using raw response as fallback"
                )

                # Check if this might be an Ollama load/initialization issue
                if "done_reason" in full_response and "load" in full_response:
                    await update_message_content_and_status(
                        ai_message,
                        "The AI model is still initializing. Please try again in a moment.",
                        "Model initializing",
                    )
                    return
                elif "done_reason" in full_response and "stop" in full_response:
                    # We have a complete Ollama response, try to parse it
                    try:
                        # Find the full JSON object that contains the response
                        import re

                        json_objects = re.findall(
                            r'\{.*?"response":[^{]*?\}', full_response, re.DOTALL
                        )

                        for json_str in json_objects:
                            try:
                                data = json.loads(json_str)
                                if "response" in data and data["response"]:
                                    await update_message_content(
                                        ai_message, data["response"]
                                    )
                                    return
                            except:
                                pass
                    except Exception as e:
                        logger.error(f"Error parsing Ollama complete response: {e}")

                # If we got here, try more generic extraction methods
                try:
                    # Clean up the raw response - try to parse the entire thing as one big JSON
                    cleaned_response = full_response.replace("data: ", "").replace(
                        "[DONE]", ""
                    )

                    # Try to find JSON objects
                    import re

                    json_objects = re.findall(r"\{.*?\}", cleaned_response, re.DOTALL)

                    extracted_text = ""
                    for json_str in json_objects:
                        try:
                            data = json.loads(json_str)
                            # Try different formats
                            if (
                                "choices" in data
                                and data["choices"]
                                and "text" in data["choices"][0]
                            ):
                                extracted_text += data["choices"][0]["text"]
                            elif "content" in data:
                                extracted_text += data["content"]
                        except:
                            pass

                    if extracted_text:
                        await update_message_content(ai_message, extracted_text)
                    else:
                        # Just use a cleaned version of the raw response
                        await update_message_content(
                            ai_message,
                            "API responded but format was unrecognized. Raw response: "
                            + cleaned_response[:500],
                        )
                except Exception as e:
                    logger.error(f"Failed to extract content from full response: {e}")
                    await update_message_content(
                        ai_message, "Failed to parse API response"
                    )

            # Mark the message as complete at the end of streaming
            await complete_message(ai_message)


@shared_task
def generate_agent_response(message_content: str, ai_message_id: str) -> None:
    """
    Generate AI response for a message and update the AI message content.

    Args:
        message_content: The user's message content to respond to
        ai_message_id: The ID of the AI message to update
    """
    try:
        # Get the AI message
        ai_message = Message.objects.get(id=ai_message_id, role="agent")

        try:
            # Update initial status
            with transaction.atomic():
                ai_message.status_generating = "Connecting to AI service..."
                ai_message.save(update_fields=["status_generating"])

            # OpenAI-compatible API endpoint
            api_url = settings.LLM_API_URL
            model = settings.LLM_MODEL_NAME

            # Prepare the request payload
            payload = {
                "model": model,
                "prompt": message_content,  # Use prompt instead of messages array
                "stream": True,
                "temperature": 0.7,
            }

            # Update status to show we're processing
            with transaction.atomic():
                ai_message.status_generating = "Generating response..."
                ai_message.save(update_fields=["status_generating"])

            loop = asyncio.get_event_loop()
            try:
                loop.run_until_complete(
                    stream_llm_response(api_url, payload, ai_message)
                )
            except RuntimeError:
                # If there's no event loop, create one
                asyncio.set_event_loop(asyncio.new_event_loop())
                loop = asyncio.get_event_loop()
                loop.run_until_complete(
                    stream_llm_response(api_url, payload, ai_message)
                )

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
                    update_fields=["content", "is_generating", "status_generating"]
                )
            raise

    except Message.DoesNotExist:
        logger.error(f"AI message {ai_message_id} not found")
        raise
