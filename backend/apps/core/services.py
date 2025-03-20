"""Base service classes for the application."""

from typing import Any, Generic, List, Optional, TypeVar

from django.db.models import Model, QuerySet

ModelType = TypeVar("ModelType", bound=Model)


class BaseService(Generic[ModelType]):
    """Base service class for models."""

    def __init__(self):
        """Initialize service."""
        pass

    def get_queryset(self) -> Optional[QuerySet[ModelType]]:
        """Get the base queryset for the service.

        Returns:
            Base queryset or None if not applicable
        """
        return None

    def get_by_id(self, id: int) -> Optional[ModelType]:
        """Get a model instance by ID.

        Args:
            id: Model instance ID

        Returns:
            Model instance if found, None otherwise
        """
        queryset = self.get_queryset()
        if queryset is None:
            return None
        try:
            return queryset.get(id=id)
        except Model.DoesNotExist:
            return None

    def list(self, **filters: Any) -> List[ModelType]:
        """List model instances.

        Args:
            **filters: Filter arguments

        Returns:
            List of model instances
        """
        queryset = self.get_queryset()
        if queryset is None:
            return []
        return list(queryset.filter(**filters))

    def create(self, **data: Any) -> Optional[ModelType]:
        """Create a new model instance.

        Args:
            **data: Instance data

        Returns:
            Created instance if successful, None otherwise
        """
        queryset = self.get_queryset()
        if queryset is None:
            return None
        try:
            return queryset.create(**data)
        except Exception:
            return None

    def update(self, instance: ModelType, **data: Any) -> bool:
        """Update a model instance.

        Args:
            instance: Model instance to update
            **data: Update data

        Returns:
            True if update was successful, False otherwise
        """
        try:
            for key, value in data.items():
                setattr(instance, key, value)
            instance.save()
            return True
        except Exception:
            return False

    def delete(self, instance: ModelType) -> bool:
        """Delete a model instance.

        Args:
            instance: Model instance to delete

        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            instance.delete()
            return True
        except Exception:
            return False

import json
from typing import Dict, Any, List, Optional
import logging
import re

from django.conf import settings
from django.contrib.auth import get_user_model
import requests
from django.utils import timezone

from apps.core.models import UserKnowledgeBase
from apps.core.logging import get_logger

User = get_user_model()
logger = get_logger(__name__)


class KnowledgeBaseService:
    """Service for managing user knowledge bases."""

    @classmethod
    def get_or_create_knowledge_base(cls, user) -> UserKnowledgeBase:
        """Get or create a knowledge base for a user."""
        knowledge_base, created = UserKnowledgeBase.objects.get_or_create(user=user)
        if created:
            # Initialize with empty knowledge
            knowledge_base.knowledge_text = cls._create_initial_knowledge_text()
            knowledge_base.save()
        return knowledge_base

    @classmethod
    def _create_initial_knowledge_text(cls) -> str:
        """Create initial knowledge text structure."""
        return """# User Knowledge Base

## Commands and Requirements
- No specific commands or requirements set yet
- This section tracks explicit instructions that must be followed (e.g. always respond in Spanish)

## Preferences
- No preferences set yet
- This section tracks user preferences that should influence responses when appropriate

## Topics of Interest
- No topics of interest identified yet

## Personal Information
- No personal information has been shared yet

## Communication Style
- No communication style preferences identified yet

## Additional Context
- No additional context available yet

Version: 1.0
Last Updated: {}""".format(timezone.now().strftime("%Y-%m-%d %H:%M:%S"))

    @classmethod
    def update_knowledge_base_from_message(cls, user, message) -> UserKnowledgeBase:
        """Update a user's knowledge base with information from a message."""
        knowledge_base = cls.get_or_create_knowledge_base(user)
        
        prompt = f"""Given the user's message and their current knowledge base, update the knowledge base with any new information.
Keep the existing format but update or add sections as needed.

Current Knowledge Base:
{knowledge_base.knowledge_text}

New Message:
"{message.content}"

Instructions:
1. Analyze the message for:
   - COMMANDS: Explicit instructions that MUST be followed (e.g. "always respond in Spanish", "never use emojis")
   - PREFERENCES: User preferences that should influence responses (e.g. "I prefer technical explanations")
   - TOPICS: Topics of interest or expertise
   - PERSONAL INFO: Any personal information shared
   - COMMUNICATION STYLE: How the user prefers to communicate
   - CONTEXT: Any other relevant information

2. Update the knowledge base sections:
   - Commands section should be authoritative and clear
   - Preferences should influence but not mandate responses
   - Maintain all existing valid information
   - Remove outdated or contradicted information
   - Group related information together

3. Format Requirements:
   - Keep the markdown structure
   - Use clear, actionable language
   - Be specific and detailed
   - Increment version by 0.1
   - Update timestamp

4. Special Handling:
   - Commands are HIGHEST priority and must be prominently listed
   - If a new command contradicts an old one, use the newest
   - Merge similar preferences/commands
   - Note any conflicts or ambiguities"""

        response = requests.post(
            settings.LLM_API_URL,
            json={
                "model": settings.LLM_MODEL_NAME,
                "prompt": prompt,
                "stream": True
            },
            stream=True
        )
        
        if response.status_code != 200:
            error_msg = f"Error from LLM API: {response.status_code} - {response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        new_knowledge_text = ""
        for line in response.iter_lines():
            if line:
                try:
                    json_response = json.loads(line.decode('utf-8'))
                    token = json_response.get("response", "")
                    new_knowledge_text += token
                except json.JSONDecodeError as e:
                    logger.warning(f"Failed to decode JSON response: {e}")
                    continue
        
        if not new_knowledge_text or len(new_knowledge_text.strip()) < 10:
            error_msg = f"No valid knowledge text generated for user {user.id}"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        logger.info(f"New knowledge text: {new_knowledge_text}")
        knowledge_base.knowledge_text = new_knowledge_text
        knowledge_base.version = round(float(knowledge_base.version) + 0.1, 1)
        knowledge_base.last_analyzed_message_id = message.id
        knowledge_base.save()
        logger.info(f"Updated knowledge base for user {user.id}")
        
        return knowledge_base

    @classmethod
    def get_knowledge_as_context(cls, user) -> str:
        """Get the knowledge base in a format suitable for AI context."""
        knowledge_base = cls.get_or_create_knowledge_base(user)
        return knowledge_base.knowledge_text
