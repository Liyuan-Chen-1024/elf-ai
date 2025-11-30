import time
import httpx

from django.conf import settings
from django.db import transaction

from celery import shared_task
from openai import OpenAI

from apps.core.logging import get_logger

from .models import Message

logger = get_logger(__name__)


@shared_task  # type: ignore
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

            # Initialize OpenAI client with custom http_client to control SSL verification
            http_client = httpx.Client(verify=settings.LLM_VERIFY_SSL)
            client = OpenAI(
                base_url=settings.LLM_API_URL,
                api_key=settings.LLM_API_KEY or "not-needed",
                http_client=http_client,
            )

            model = settings.LLM_MODEL_NAME or "default"

            logger.info(
                f"Sending request to LLM API: {settings.LLM_API_URL} "
                f"with model {model}"
            )

            # Update status to show we're processing
            with transaction.atomic():
                ai_message.status_generating = "Generating response..."
                ai_message.save(update_fields=["status_generating"])

            # Make the request to OpenAI compatible API
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": message_content}],
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
