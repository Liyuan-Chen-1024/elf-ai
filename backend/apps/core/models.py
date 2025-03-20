import uuid
from datetime import datetime
from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class TimeStampedModel(models.Model):
    """Base model with created_at and updated_at fields."""

    created_at: datetime = models.DateTimeField(auto_now_add=True)
    updated_at: datetime = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UUIDModel(models.Model):
    """Base model with UUID as primary key."""

    id: uuid.UUID = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )

    class Meta:
        abstract = True


class UserKnowledgeBase(TimeStampedModel, UUIDModel):
    """
    Model to store a knowledge base for each user with information about their
    preferences, interests, and any other relevant context.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='knowledge_base'
    )
    
    # Structured fields for specific types of knowledge
    topics = models.JSONField(default=dict, blank=True, help_text="Topics the user is interested in")
    preferences = models.JSONField(default=dict, blank=True, help_text="User preferences")
    
    # Free-text knowledge representation that the AI can structure as needed
    knowledge_text = models.TextField(
        blank=True,
        help_text="AI-maintained knowledge about the user in a structured format"
    )
    
    # Metadata about the knowledge base
    last_analyzed_message_id = models.UUIDField(
        null=True, 
        blank=True,
        help_text="ID of the last message that was analyzed to update this knowledge base"
    )
    knowledge_version = models.IntegerField(
        default=1,
        help_text="Version of the knowledge structure, for tracking schema changes"
    )
    
    # Version field
    version = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=1.0,
        help_text="Version number for tracking knowledge base updates"
    )
    
    class Meta:
        verbose_name = "User Knowledge Base"
        verbose_name_plural = "User Knowledge Bases"
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['updated_at']),
        ]
    
    def __str__(self):
        return f"Knowledge base for {self.user.username}"
    
    @classmethod
    def get_for_user(cls, user):
        """
        Get or create a knowledge base for a user.
        """
        knowledge_base, created = cls.objects.get_or_create(user=user)
        return knowledge_base
    
    def update_from_message(self, message):
        """
        Update the knowledge base with information from a new message.
        This will be implemented with a service that uses AI to extract relevant information.
        """
        # This is a placeholder. The actual implementation will be in a service.
        self.last_analyzed_message_id = message.id
        self.save(update_fields=['last_analyzed_message_id', 'updated_at'])
        
    def as_context(self):
        """
        Return the knowledge base in a format suitable for providing as context to the AI.
        """
        return {
            "topics": self.topics,
            "preferences": self.preferences,
            "knowledge": self.knowledge_text,
        }
