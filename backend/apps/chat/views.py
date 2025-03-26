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
            
            user_message = Message.objects.create(
                conversation=conversation,
                role="user",
                content=content
            )

            update_knowledge_base_from_message.delay(
                user_id=conversation.user.id,
                message_id=user_message.id
            )
            
            return Response(MessageSerializer([user_message], many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="responses/stream")
    def stream_response(self, request: Request, pk=None) -> StreamingHttpResponse:
        """
        Stream AI response tokens in real-time using Server-Sent Events (SSE).
        This endpoint streams the agent's response to a user message.
        """
        from django.middleware.csrf import get_token
        
        # Force a CSRF cookie to be set
        get_token(request)
        
        try:
            conversation = self.get_object()
            serializer = MessageCreateSerializer(data=request.data)

            agent_message = Message.objects.create(
                conversation=conversation,
                role="agent", 
                content=""
            )

            if not serializer.is_valid():
                logger.error(f"Invalid data for stream_response: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            content = serializer.validated_data["content"]

            #print("UHIDSUFHDISUHF", content)
            
            logger.info(f"Starting response stream for conversation {pk} with content: {content}")
            logger.info(f"Request headers: {request.headers}")
            logger.info(f"CSRF cookie set: {request.COOKIES.get('csrftoken', 'Not found')}")

            def stream_response():
                try:
                    # Get conversation history for context
                    history = conversation.messages.filter(is_deleted=False).order_by(
                        "-created_at"
                    )[:5][::-1]  # Last 5 messages in chronological order

                    # Get user knowledge base for personalization
                    user_knowledge = KnowledgeBaseService.get_knowledge_as_context(user=conversation.user)
                    
                    # Build conversation context with personalized knowledge
                    context = (
                        "You are Elf AI, a helpful AI Agent that personalizes responses based on the user's preferences and interests. Wrap thinking process in <think> tags.\n\n"
                    )

                    context = context
                    #context += f"{user_knowledge}\n\n"
                    
                    # Add conversation history
#                    for msg in history:
#                        context += f"{msg.role}: {msg.content}\n"
#                    context += f"user: {content}\nagent:"

                    logger.info(f"Sending initial SSE message for conversation {pk}")
                    # Initial response to establish connection
                    yield f"data: {json.dumps({'type': 'start', 'message_id': str(conversation.messages.last().id)})}\n\n"

                    # Make streaming request to LLM
                    logger.info(f"Making LLM request to {settings.LLM_API_URL}")
                    try:
                        response = requests.post(
                            settings.LLM_API_URL,
                            json={
                                "model": settings.LLM_MODEL_NAME,
                                "prompt": content,
                                "stream": True,
                            },
                            stream=True,
                            timeout=30,
                        )
                        logger.info(f"LLM response status: {response.status_code}")

                        if response.status_code == 200:
                            full_response = ""
                            
                            # Send initial message to indicate we're starting content streaming
                            yield f"data: {json.dumps({'type': 'start_content'})}\n\n"
                            
                            buffer = []
                            for line in response.iter_lines():
                                if line:
                                    try:
                                        json_response = json.loads(line.decode("utf-8"))
                                        logger.debug(f"LLM raw response: {json_response}")
                                        token = json_response.get("response", "")

                                        if token:
                                            full_response += token        
                                            # Send each token immediately without buffering
                                            #logger.debug(f"Sending token: {token}")
                                            if len(buffer) > 3:
                                                yield f"data: {json.dumps({'type': 'token', 'content': ''.join(buffer)})}\n\n"
                                                buffer = []
                                            buffer.append(token)
                                    except json.JSONDecodeError as e:
                                        logger.error(f"Error decoding LLM response: {e}, line: {line}")
                                        continue
    
                            if buffer:
                                yield f"data: {json.dumps({'type': 'token', 'content': ''.join(buffer)})}\n\n"
                            
                            agent_message.content = full_response                
                            agent_message.save(update_fields=["content", "updated_at"])
                            # Send completion message to show thinking toggle - IMPORTANT
                            yield f"data: {json.dumps({'type': 'content_complete'})}\n\n"
                        else:
                            error_msg = f"Error from LLM API: {response.status_code}"
                            logger.error(error_msg)
                            yield f"data: {json.dumps({'type': 'error', 'content': error_msg})}\n\n"
                    except requests.RequestException as e:
                        error_msg = f"Request error to LLM API: {str(e)}"
                        logger.exception(error_msg)
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
            
        except Exception as e:
            logger.exception(f"Unhandled exception in stream_response view: {str(e)}")
            return Response(
                {"error": f"Internal server error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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
