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
        ("system", "System"),
    ]

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    content: str = models.TextField()
    is_generating: bool = models.BooleanField(default=False)
    status_generating: str = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Current generation status (e.g., 'Thinking', 'Browsing')",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
        ]

    def __str__(self):
        return f"{self.role} message in {self.conversation.title} ({self.id})"


class Memory(TimeStampedModel, UUIDModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="memory"
    )
    data = models.JSONField(
        default=dict, 
        help_text="Structured user profile data (e.g., {'personal': ..., 'interests': ...})"
    )
    
    class Meta:
        verbose_name = "User Memory Profile"
        verbose_name_plural = "User Memory Profiles"

    def __str__(self):
        return f"Memory Profile for {self.user}"
