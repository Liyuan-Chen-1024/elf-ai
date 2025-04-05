import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union, cast

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

from apps.core.models import TimeStampedModel, UUIDModel

User = get_user_model()


class Conversation(TimeStampedModel, UUIDModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations"
    )

    title = models.CharField(max_length=255, default="New conversation")
    
    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["-updated_at"]),
            models.Index(fields=["user", "-updated_at"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.id})"


class Message(TimeStampedModel, UUIDModel):
    ROLE_CHOICES = [
        ("user", "User"),
        ("agent", "Agent"),
    ]

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    is_generating = models.BooleanField(default=False)
    
    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
        ]

    def __str__(self):
        return f"{self.role} message in {self.conversation.title} ({self.id})"

