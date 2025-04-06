from typing import Generator
import json
import time
from celery import shared_task
from django.db import transaction
from apps.core.logging import get_logger

from .models import Message

logger = get_logger(__name__)

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
        ai_message = Message.objects.get(id=ai_message_id, role='agent')
        
        try:
            # Update initial status
            with transaction.atomic():
                ai_message.status_generating = "Analyzing your message..."
                ai_message.save(update_fields=['status_generating'])

            # Your AI generation logic here
            # This is a placeholder - replace with your actual AI logic
            response_chunks = [
                "Let me think about your message carefully. ",
                "I understand you're asking about: ",
                message_content + ". ",
                "\n\nFirst, let me analyze this in detail. ",
                "There are several important aspects to consider here. ",
                "Let's break this down step by step.\n\n",
            ]

            
            # Update status to show we're processing
            with transaction.atomic():
                ai_message.status_generating = "Formulating response..."
                ai_message.save(update_fields=['status_generating'])

            time.sleep(2)

            # First set of thoughts
            response_chunks.extend([
                "1. The initial perspective: Your question touches on some fundamental concepts. ",
                "It's important to approach this systematically and thoughtfully. ",
                "\n\n2. Going deeper: When we examine this more closely, ",
            ])


            # Update status for deeper analysis
            with transaction.atomic():
                ai_message.status_generating = "Analyzing implications..."
                ai_message.save(update_fields=['status_generating'])


            # More detailed analysis
            response_chunks.extend([
                "we can see various interconnected elements at play. ",
                "Each one contributes to the overall picture in its own unique way. ",
                "\n\n3. Consider the implications: This leads us to some interesting conclusions. ",
                "Not only about the immediate question, but also about related concepts. ",
            ])

            # Update status for conclusion
            with transaction.atomic():
                ai_message.status_generating = "Finalizing response..."
                ai_message.save(update_fields=['status_generating'])

            # Conclusion
            response_chunks.extend([
                "\n\nTo summarize the key points:\n",
                "• First, we need to acknowledge the complexity of the matter\n",
                "• Second, there are multiple valid approaches to consider\n",
                "• Third, the context plays a crucial role in understanding\n",
                "\n\nIn conclusion, ",
                "while this is a comprehensive overview, ",
                "there's always room for further discussion and exploration. ",
                "Would you like me to elaborate on any particular aspect?"
            ])
            
            # Update message content progressively
            accumulated_content = ""
            for chunk in response_chunks:
                accumulated_content += chunk
                with transaction.atomic():
                    ai_message.content = accumulated_content
                    ai_message.save(update_fields=['content'])
        
            # Mark generation as complete
            with transaction.atomic():
                ai_message.is_generating = False
                ai_message.status_generating = "Completed"  # Use empty string instead of None
                ai_message.save(update_fields=['is_generating', 'status_generating'])
                
        except Exception as e:
            logger.exception(f"Error generating AI response for message {ai_message_id}")
            # Update message to indicate error
            with transaction.atomic():
                ai_message.content = f"Error generating response: {str(e)}"
                ai_message.is_generating = False
                ai_message.status_generating = "Error occurred"
                ai_message.save(update_fields=['content', 'is_generating', 'status_generating'])
            raise
            
    except Message.DoesNotExist:
        logger.error(f"AI message {ai_message_id} not found")
        raise 