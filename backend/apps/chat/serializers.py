from typing import Any, Dict, List

from rest_framework import serializers

from drf_spectacular.utils import extend_schema_field

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message objects, formatted as expected by the frontend."""

    sender = serializers.SerializerMethodField()
    conversation_id = serializers.UUIDField()
    created_at = serializers.DateTimeField(read_only=True)
    role = serializers.CharField(read_only=True)
    is_generating = serializers.BooleanField(read_only=True)
    status_generating = serializers.CharField(read_only=True, allow_null=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation_id",
            "content",
            "sender",
            "created_at",
            "role",
            "is_generating",
            "status_generating",
        ]
        read_only_fields = [
            "id",
            "timestamp",
            "role",
            "is_generating",
            "status_generating",
        ]

    @extend_schema_field(
        {
            "type": "object",
            "properties": {"id": {"type": "string"}, "name": {"type": "string"}},
        }
    )
    def get_sender(self, obj: Message) -> Dict[str, str]:
        """Return sender information in the format expected by the frontend."""
        if obj.role == "user":
            # Get the conversation's user as the sender
            user = obj.conversation.user
            return {
                "id": str(user.id),
                "name": user.get_full_name() or user.username,
            }
        else:
            # Assistant sender
            return {
                "id": "agent",  # Use string ID for consistency with frontend
                "name": "Elf Agent",  # Use the consistent name
            }


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for Conversation objects, formatted as expected by the frontend."""

    participants = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
            "messages",
            "message_count",
            "participants",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    @extend_schema_field(
        {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"id": {"type": "string"}, "name": {"type": "string"}},
            },
        }
    )
    def get_participants(self, obj: Conversation) -> List[Dict[str, str]]:
        """Return conversation participants in the format expected by the frontend."""
        user = obj.user
        return [
            {
                "id": str(user.id),
                "name": user.get_full_name() or user.username,
            },
            {
                "id": "agent",  # Use string ID for consistency with frontend
                "name": "Elf Agent",  # Use the consistent name
            },
        ]

    @extend_schema_field({"type": "integer"})
    def get_message_count(self, obj: Conversation) -> int:
        """Return count of non-deleted messages."""
        return obj.messages.filter().count()


class MessageCreateSerializer(serializers.Serializer):
    """Serializer for creating new Message objects."""

    content = serializers.CharField(required=True, allow_blank=False)

    def validate_content(self, value: str) -> str:
        """Validate that the message content is not empty."""
        if not value.strip():
            raise serializers.ValidationError("Message content cannot be empty.")
        return value.strip()


class MessageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("content",)
