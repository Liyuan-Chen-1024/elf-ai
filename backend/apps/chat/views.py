import json
from typing import Any, Dict

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

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    MessageCreateSerializer,
    MessageSerializer,
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

    @action(detail=True, methods=["get"])
    def messages(self, request: Request, pk=None) -> Response:
        conversation = self.get_object()
        messages = conversation.messages.filter(is_deleted=False).order_by("created_at")
        return Response(MessageSerializer(messages, many=True).data)

    @action(detail=True, methods=["post"])
    def stream_message(self, request: Request, pk=None) -> StreamingHttpResponse:
        conversation = self.get_object()
        serializer = MessageCreateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        content = serializer.validated_data["content"]

        def stream_response():
            try:
                # Create user message and initial assistant message
                with transaction.atomic():
                    Message.objects.create(
                        conversation=conversation, role="user", content=content
                    )
                    assistant_message = Message.objects.create(
                        conversation=conversation, role="assistant", content=""
                    )

                # Get conversation history for context
                history = conversation.messages.filter(is_deleted=False).order_by(
                    "-created_at"
                )[:5][
                    ::-1
                ]  # Last 5 messages in chronological order

                # Build conversation context
                context = "You are an AI assistant. Be helpful and concise.\n\n"
                for msg in history:
                    context += f"{msg.role}: {msg.content}\n"
                context += f"user: {content}\nassistant:"

                # Initial response to establish connection
                yield f"data: {json.dumps({'type': 'start', 'message_id': str(assistant_message.id)})}\n\n"

                # Make streaming request to LLM
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
                    for line in response.iter_lines():
                        if line:
                            try:
                                json_response = json.loads(line.decode("utf-8"))
                                token = json_response.get("response", "")

                                if token:
                                    full_response += token
                                    assistant_message.content = full_response
                                    assistant_message.save()

                                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                            except json.JSONDecodeError:
                                continue
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
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

        response = StreamingHttpResponse(
            stream_response(), content_type="text/event-stream"
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
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
