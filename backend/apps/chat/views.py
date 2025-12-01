"""
Views for the chat application.

This module provides API views for managing conversations and messages,
including streaming functionality for agent responses.
"""

import json
import time
from collections.abc import Generator

from django.db import transaction
from django.http import StreamingHttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from apps.chat.models import Conversation, Message
from apps.chat.serializers import (
    ConversationSerializer,
    MessageCreateSerializer,
    MessageSerializer,
)
from apps.chat.tasks import generate_agent_response
from apps.core.logging import get_logger

logger = get_logger(__name__)


class ConversationViewSet(viewsets.ModelViewSet):
    """
    API viewset for managing conversations.

    Provides CRUD operations for conversations and nested endpoints
    for managing messages within conversations.
    """

    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return conversations for the authenticated user, ordered by last update."""
        return (
            Conversation.objects.filter(user=self.request.user)
            .prefetch_related("messages")
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        """Save the conversation with the authenticated user."""
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["GET", "POST"])
    def messages(self, request: Request, pk=None) -> Response:
        """
        List and create messages for a specific conversation.

        GET: Returns all messages in the conversation
        POST: Creates a new user message and initiates an agent response
        """
        conversation = self.get_object()

        if request.method == "GET":
            messages = conversation.messages.all().order_by("created_at")
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)

        elif request.method == "POST":
            serializer = MessageCreateSerializer(data=request.data)
            if serializer.is_valid(raise_exception=True):
                # Create the user's message
                user_message = Message.objects.create(
                    conversation=conversation,
                    content=serializer.validated_data["content"],
                    is_generating=False,
                    role="user",
                )

                # Create a placeholder for the agent's response
                agent_message = Message.objects.create(
                    conversation=conversation,
                    content="",
                    is_generating=True,
                    role="agent",
                )

                # Start the agent response generation task
                generate_agent_response.delay(
                    message_content=user_message.content,
                    ai_message_id=str(agent_message.id),
                )

                return Response(
                    {
                        "user_message": MessageSerializer(user_message).data,
                        "agent_message": MessageSerializer(agent_message).data,
                    },
                    status=status.HTTP_201_CREATED,
                )

        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(
        detail=True, methods=["GET"], url_path="messages/(?P<message_id>[^/.]+)/stream"
    )
    def stream_agent_response(
        self, request: Request, pk=None, message_id=None
    ) -> StreamingHttpResponse | Response:
        """
        Stream the agent's response for a specific message.

        Provides real-time updates on message content and generation status
        through server-sent events (SSE).
        """
        conversation = self.get_object()
        try:
            message = conversation.messages.get(id=message_id, role="agent")
        except Message.DoesNotExist:
            return Response(
                {"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND
            )

        def event_stream() -> Generator[str, None, None]:
            """
            Generate streaming response events.

            Yields JSON-formatted strings for the SSE stream with progressive
            updates to the message content and status.
            """
            try:
                last_content = ""
                # Initial event with starting state
                yield json.dumps(
                    {
                        "type": "start",
                        "message_id": str(message.id),
                        "is_generating": message.is_generating,
                        "status_generating": message.status_generating,
                        "content": message.content,
                    }
                ) + "\n"

                while True:
                    # Refresh message from database
                    message.refresh_from_db()

                    # Get new content since last update
                    new_content = message.content[len(last_content) :]
                    if new_content:
                        last_content = message.content
                        yield json.dumps(
                            {
                                "type": "chunk",
                                "message_id": str(message.id),
                                "is_generating": message.is_generating,
                                "status_generating": message.status_generating,
                                "content": new_content,
                            }
                        ) + "\n"

                    # If generation is complete, send final message and end
                    if not message.is_generating:
                        yield json.dumps(
                            {
                                "type": "end",
                                "message_id": str(message.id),
                                "is_generating": message.is_generating,
                                "status_generating": message.status_generating,
                                "content": message.content,
                            }
                        ) + "\n"
                        break

                    time.sleep(0.1)  # Small delay to prevent excessive database queries

            except Exception as e:
                logger.exception("Error in stream_response")
                yield json.dumps(
                    {
                        "type": "error",
                        "message_id": str(message.id),
                        "error": str(e),
                        "is_generating": False,
                        "status_generating": "Error",
                        "content": "",
                    }
                ) + "\n"

        return StreamingHttpResponse(
            streaming_content=event_stream(), content_type="text/event-stream"
        )


class MessageViewSet(viewsets.ModelViewSet):
    """
    API viewset for managing individual messages.

    Provides CRUD operations for messages with proper user filtering.
    """

    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return messages for the authenticated user with related conversations."""
        return Message.objects.filter(
            conversation__user=self.request.user
        ).select_related("conversation")
