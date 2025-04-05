from typing import Any, Dict, Generator, List
import json
import time
import asyncio

from django.conf import settings
from django.db import transaction
from django.http import StreamingHttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.core.logging import get_logger
from apps.chat.tasks import generate_agent_response
from apps.chat.models import Conversation, Message
from apps.chat.serializers import (
    ConversationSerializer,
    MessageCreateSerializer,
    MessageSerializer,
    MessageUpdateSerializer
)


logger = get_logger(__name__)

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

    @action(detail=True, methods=['GET', 'POST'])
    def messages(self, request: Request, pk=None):
        """List and create messages for a specific conversation."""
        conversation = self.get_object()
        
        if request.method == 'GET':
            messages = conversation.messages.all().order_by('created_at')
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = MessageCreateSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                # Create the user's message
                user_message = Message.objects.create(
                    conversation=conversation,
                    content=serializer.validated_data['content'],
                    role='user'
                )
                
                # Create a placeholder for the AI's response
                agent_message = Message.objects.create(
                    conversation=conversation,
                    content="",
                    is_generating=True,
                    role='agent'
                )

                # Start the AI response generation task
                generate_agent_response.delay(
                    message_content=user_message.content,
                    ai_message_id=str(agent_message.id)
                )

                return Response({
                    "message": MessageSerializer(user_message).data,
                    "agent_message_id": agent_message.id
                }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['GET'], url_path='messages/(?P<message_id>[^/.]+)/stream')
    def stream_agent_response(self, request: Request, pk=None, message_id=None):
        """Stream the AI's response for a specific message."""
        conversation = self.get_object()
        try:
            message = conversation.messages.get(id=message_id, role='agent')
        except Message.DoesNotExist:
            return Response(
                {"error": "Message not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        def event_stream() -> Generator[str, None, None]:
            """Generate streaming response events."""
            try:
                last_content = ""
                yield json.dumps({"type": "start", "message_id": str(message.id)}) + "\n"

                while True:
                    # Refresh message from database
                    message.refresh_from_db()
                    
                    # Get new content since last update
                    new_content = message.content[len(last_content):]
                    if new_content:
                        last_content = message.content
                        yield json.dumps({
                            "type": "chunk",
                            "message_id": str(message.id),
                            "content": new_content
                        }) + "\n"
                    
                    # If generation is complete, send final message and end
                    if not message.is_generating:
                        yield json.dumps({
                            "type": "end",
                            "message_id": str(message.id),
                            "content": message.content
                        }) + "\n"
                        break
                    
                    time.sleep(0.1)  # Small delay to prevent excessive database queries
                
            except Exception as e:
                logger.exception("Error in stream_response")
                yield json.dumps({
                    "type": "error",
                    "message_id": str(message.id),
                    "error": str(e)
                }) + "\n"

        return StreamingHttpResponse(
            streaming_content=event_stream(),
            content_type="text/event-stream"
        )

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(
            conversation__user=self.request.user
        ).select_related("conversation")
