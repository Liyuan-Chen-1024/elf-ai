from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Conversation, Message

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User objects, formatted as expected by the frontend."""
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ("id", "username", "email", "name", "avatar")
    
    def get_avatar(self, obj):
        """Return a placeholder avatar URL."""
        return f"https://i.pravatar.cc/150?img={obj.id}"
    
    def get_name(self, obj):
        """Return the user's name or username if name is not available."""
        return obj.get_full_name() or obj.username


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message objects, formatted as expected by the frontend."""
    sender = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source='created_at')
    conversationId = serializers.UUIDField(source='conversation_id')
    isEdited = serializers.BooleanField(source='is_edited', read_only=True)
    role = serializers.CharField(read_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id',
            'conversationId',
            'content',
            'sender',
            'timestamp',
            'isEdited',
            'role',
            'is_deleted'
        ]
        read_only_fields = ['id', 'timestamp', 'role']
    
    def get_sender(self, obj):
        """Return sender information in the format expected by the frontend."""
        if obj.role == 'user':
            # Get the conversation's user as the sender
            user = obj.conversation.user
            return {
                "id": user.id,
                "name": user.get_full_name() or user.username,
                "avatar": f"https://i.pravatar.cc/150?img={user.id}"
            }
        else:
            # Assistant sender
            return {
                "id": "assistant",  # Use string ID for consistency with frontend
                "name": "Elf Agent",  # Use the consistent name
                "avatar": "https://i.pravatar.cc/150?img=2"
            }
    
    def to_representation(self, instance):
        """Convert model field names to frontend field names."""
        ret = super().to_representation(instance)
        ret['conversationId'] = instance.conversation_id
        ret['isEdited'] = instance.is_edited
        return ret


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for Conversation objects, formatted as expected by the frontend."""
    lastMessage = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()
    createdAt = serializers.DateTimeField(source='created_at')
    updatedAt = serializers.DateTimeField(source='updated_at')
    archived = serializers.BooleanField(source='is_archived', default=False)
    messages = MessageSerializer(many=True, read_only=True)
    messageCount = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 
            'title', 
            'createdAt',
            'updatedAt',
            'archived',
            'messages', 
            'messageCount',
            'lastMessage',
            'participants'
        ]
        read_only_fields = ['id', 'createdAt', 'updatedAt']
    
    def get_participants(self, obj):
        """Return conversation participants in the format expected by the frontend."""
        user = obj.user
        return [
            {
                "id": user.id,
                "name": user.get_full_name() or user.username,
                "avatar": f"https://i.pravatar.cc/150?img={user.id}"
            },
            {
                "id": "assistant",  # Use string ID for consistency with frontend
                "name": "Elf Agent",  # Use the consistent name
                "avatar": "https://i.pravatar.cc/150?img=2"
            }
        ]
    
    def get_lastMessage(self, obj):
        """Return the last non-deleted message in this conversation."""
        last_message = obj.messages.filter(is_deleted=False).order_by('-created_at').first()
        if last_message:
            return MessageSerializer(last_message).data
        return None

    def get_messageCount(self, obj):
        """Return count of non-deleted messages."""
        return obj.messages.filter(is_deleted=False).count()


class MessageCreateSerializer(serializers.Serializer):
    """Serializer for creating new Message objects."""
    content = serializers.CharField(required=True, allow_blank=False)

    def validate_content(self, value):
        """Validate that the message content is not empty."""
        if not value.strip():
            raise serializers.ValidationError("Message content cannot be empty.")
        return value.strip()


class MessageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ("content",)
