import json
import time
import re
from typing import Any, Dict, Generator, List

from django.conf import settings
from django.db import transaction
from django.http import StreamingHttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

import requests

from apps.core.logging import get_logger
from apps.core.tasks import update_knowledge_base_from_message
from apps.core.services import KnowledgeBaseService

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    MessageCreateSerializer,
    MessageSerializer,
)

logger = get_logger(__name__)


def tokenize_text(text: str) -> List[str]:
    """
    Tokenize text into natural chunks for streaming.
    This is a simple implementation that splits on space, punctuation, and keeps punctuation attached.
    """
    # Split on spaces but keep punctuation attached to the previous word
    tokens = []
    pattern = r'([,.!?;:])'
    
    # First split by spaces
    space_split = text.split()
    
    for word in space_split:
        # Check if the word has punctuation
        parts = re.split(pattern, word)
        
        # Filter out empty strings
        parts = [p for p in parts if p]
        
        if len(parts) > 1:
            # If there's punctuation, add the word and punctuation separately
            for i in range(0, len(parts) - 1, 2):
                if i + 1 < len(parts):
                    tokens.append(parts[i] + parts[i + 1])
                else:
                    tokens.append(parts[i])
        else:
            # No punctuation, just add the word
            tokens.append(word)
    
    return tokens


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Conversation.objects.filter(user=self.request.user)
            .prefetch_related("messages")
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def archive(self, request: Request, pk=None) -> Response:
        conversation = self.get_object()
        conversation.is_archived = True
        conversation.save()
        return Response(self.get_serializer(conversation).data)

    @action(detail=True, methods=["post"])
    def unarchive(self, request: Request, pk=None) -> Response:
        conversation = self.get_object()
        conversation.is_archived = False
        conversation.save()
        return Response(self.get_serializer(conversation).data)

    @action(detail=True, methods=["get", "post"])
    def messages(self, request: Request, pk=None) -> Response:
        conversation = self.get_object()
        
        # GET method - retrieve messages
        if request.method == "GET":
            messages = conversation.messages.filter(is_deleted=False).order_by("created_at")
            return Response(MessageSerializer(messages, many=True).data)
        
        # POST method - create a new message
        elif request.method == "POST":
            serializer = MessageCreateSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            content = serializer.validated_data["content"]
            
            # Create user message
            message = Message.objects.create(
                conversation=conversation,
                role="user",
                content=content
            )
            
            # Also create an initial assistant message
            assistant_message = Message.objects.create(
                conversation=conversation,
                role="assistant", 
                content=""  # Start with empty content, will be filled by AI response
            )
            
            # Optional: Trigger any async processing or response generation here
            # You might want to call a task or service to generate a response
            
            # Return the created message
            return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)

    def _stream_tokens(
        self, tokens: List[str], assistant_message: Message
    ) -> Generator[str, None, None]:
        """
        Stream tokens with a natural typing rhythm.
        Updates the assistant message with each token.
        
        Args:
            tokens: List of tokens to stream
            assistant_message: Message object to update
            
        Yields:
            SSE formatted data strings
        """
        full_response = ""
        for token in tokens:
            # Add a small delay for more natural typing (20-30ms per token)
            time.sleep(0.02)
            
            # Add space before token if not punctuation and not first token
            if full_response and not token.startswith((",", ".", "!", "?", ";", ":")):
                token = " " + token
                
            full_response += token
            
            # Update the message in the database
            assistant_message.content = full_response.strip()
            assistant_message.save(update_fields=["content", "updated_at"])
            
            # Yield the token for streaming
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

    @action(detail=True, methods=["post"])
    def stream_message(self, request: Request, pk=None) -> StreamingHttpResponse:
        from django.middleware.csrf import get_token
        
        # Force a CSRF cookie to be set
        get_token(request)
        
        conversation = self.get_object()
        serializer = MessageCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        content = serializer.validated_data["content"]
        logger.info(f"Starting stream for conversation {pk} with content: {content}")
        logger.info(f"Request headers: {request.headers}")
        logger.info(f"CSRF cookie set: {request.COOKIES.get('csrftoken', 'Not found')}")

        def stream_response():
            try:
                # Create user message and initial assistant message
                with transaction.atomic():
                    user_message = Message.objects.create(
                        conversation=conversation, role="user", content=content
                    )
                    assistant_message = Message.objects.create(
                        conversation=conversation, role="assistant", content=""
                    )
                
                # Update knowledge base asynchronously
                update_knowledge_base_from_message.delay(
                    user_id=conversation.user.id,
                    message_id=user_message.id
                )

                # Get conversation history for context
                history = conversation.messages.filter(is_deleted=False).order_by(
                    "-created_at"
                )[:5][::-1]  # Last 5 messages in chronological order

                # Get user knowledge base for personalization
                user_knowledge = KnowledgeBaseService.get_knowledge_as_context(user=conversation.user)
                
                # Build conversation context with personalized knowledge
                context = (
                    "You are Elf AI, a helpful AI assistant that personalizes responses based on the user's preferences and interests.\n\n"
                    f"{user_knowledge}\n\n"
                    "IMPORTANT INSTRUCTIONS:\n"
                    "1. You MUST follow any commands in the 'Commands and Requirements' section above - these are non-negotiable\n"
                    "2. You should adapt your responses based on the preferences listed, while still following commands\n"
                    "3. Format your response in markdown\n"
                    "4. For lists, use proper markdown list formatting:\n"
                    "   - Numbered lists should use '1. ', '2. ' etc.\n"
                    "   - Bullet points should use '- ' or '* '\n"
                    "   - Ensure each list item is on a new line\n"
                    "5. Be helpful and concise\n"
                    "6. Reference the user's known interests and preferences when relevant\n"
                    "7. Don't explicitly mention that you know these details unless asked directly\n"
                    "8. Use proper markdown spacing (blank lines between sections)\n"
                    "9. IMPORTANT: Only provide the direct response to the user's question. Do not include any knowledge base updates or internal processing information in your response.\n"
                    "10. CRITICAL: Start your response with your thinking process wrapped in <think> tags. For example:\n"
                    "    <think>First, I'll analyze the user's question. Then, I'll consider their preferences and provide a tailored response.</think>\n\n"
                    "    Then provide your actual response after the think tags.\n\n"
                )
                
                # Add conversation history
                for msg in history:
                    context += f"{msg.role}: {msg.content}\n"
                context += f"user: {content}\nassistant:"

                logger.info(f"Sending initial SSE message for conversation {pk}")
                # Initial response to establish connection
                yield f"data: {json.dumps({'type': 'start', 'message_id': str(assistant_message.id)})}\n\n"

                # Make streaming request to LLM
                logger.info(f"Making LLM request to {settings.LLM_API_URL}")
                response = requests.post(
                    settings.LLM_API_URL,
                    json={
                        "model": settings.LLM_MODEL_NAME,
                        "prompt": context,
                        "stream": True,
                    },
                    stream=True,
                    timeout=30,
                )

                if response.status_code == 200:
                    full_response = ""
                    token_buffer = ""
                    last_save_time = time.time()
                    
                    # Send initial message to indicate we're starting content streaming
                    yield f"data: {json.dumps({'type': 'start_content'})}\n\n"
                    
                    for line in response.iter_lines():
                        if line:
                            try:
                                json_response = json.loads(line.decode("utf-8"))
                                token = json_response.get("response", "")

                                if token:
                                    # Add token to buffer
                                    token_buffer += token
                                    current_time = time.time()
                                    
                                    # Check if we have a complete markdown element
                                    complete_chunk = (
                                        # End of line for list items and paragraphs
                                        token_buffer.endswith("\n") or
                                        # Complete sentence
                                        any(token_buffer.rstrip().endswith(c) for c in ".!?") or
                                        # Complete phrase
                                        any(token_buffer.rstrip().endswith(c) for c in ",;:") or
                                        # Complete markdown list item
                                        (token_buffer.strip().startswith(("1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.", "10.", "-", "*")) and
                                         token_buffer.endswith("\n"))
                                    )
                                    
                                    # Time or size-based threshold with markdown awareness
                                    should_send = (
                                        # Time threshold reached
                                        (current_time - last_save_time >= 1 and 
                                         (token_buffer.endswith((" ", "\n")) or complete_chunk)) or
                                        # Size threshold reached
                                        (len(token_buffer) >= 30 and 
                                         (token_buffer.endswith((" ", "\n")) or complete_chunk)) or
                                        # Complete markdown element
                                        complete_chunk
                                    )
                                    
                                    if should_send and token_buffer:
                                        chunk = token_buffer
                                        if chunk:
                                            # Preserve exact markdown formatting
                                            full_response += chunk
                                            assistant_message.content = full_response
                                            assistant_message.save(update_fields=["content", "updated_at"])
                                            
                                            logger.debug(f"Sending chunk: {chunk}")
                                            yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
                                        
                                        token_buffer = ""
                                        last_save_time = current_time
                            except json.JSONDecodeError as e:
                                logger.error(f"Error decoding LLM response: {e}, line: {line}")
                                continue
                    
                    # Send completion message to show thinking toggle
                    yield f"data: {json.dumps({'type': 'content_complete'})}\n\n"
                else:
                    error_msg = f"Error from LLM API: {response.status_code}"
                    logger.error(error_msg)
                    yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"

            except Exception as e:
                error_msg = f"Error in message streaming: {str(e)}"
                logger.exception(error_msg)
                yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"

            finally:
                # Always send a done event
                logger.info(f"Completing stream for conversation {pk}")
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

        # Create and configure the streaming response
        response = StreamingHttpResponse(
            stream_response(),
            content_type='text/event-stream',
            status=200
        )
        
        # Add required headers for SSE
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        
        # Add CORS headers
        if 'HTTP_ORIGIN' in request.META:
            origin = request.META['HTTP_ORIGIN']
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken, Accept'
            response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
            response['Access-Control-Expose-Headers'] = 'Content-Type'
        
        # Set Vary header to avoid caching issues
        response['Vary'] = 'Accept, Cookie, Origin'
        
        return response


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(
            conversation__user=self.request.user, is_deleted=False
        ).select_related("conversation")

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()
