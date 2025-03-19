from datetime import datetime
from typing import Any, Dict, List, Optional, Union, cast

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from django.conf import settings
import uuid

from apps.core.models import TimeStampedModel, UUIDModel

User = get_user_model()


class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=255, default="New conversation")
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['-updated_at']),
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['user', 'is_archived', '-updated_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.id})"


class Message(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)
    is_edited = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['conversation', 'is_deleted', 'created_at']),
        ]

    def __str__(self):
        return f"{self.role} message in {self.conversation.title} ({self.id})"

    def edit(self, new_content: str) -> None:
        """Edit a message's content.

        Args:
            new_content: The new content for the message
        """
        self.content = new_content
        self.is_edited = True
        self.save()
