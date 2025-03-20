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
            knowledge_base.topics = {"topics": []}
            knowledge_base.save()
        return knowledge_base

    @classmethod
    def _create_initial_knowledge_text(cls) -> str:
        """Create initial knowledge text structure."""
        return """# User Knowledge Base

## Commands and Requirements
- No specific commands or requirements set yet
- This section tracks explicit instructions that must be followed (e.g. always respond in Spanish)

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
        
        # First update the knowledge text
        knowledge_prompt = f"""Given the user's message and their current knowledge base, update the knowledge base with any new information.
Keep the existing format but update or add sections as needed.

Current Knowledge Base:
{knowledge_base.knowledge_text}

New Message:
"{message.content}"

Instructions:
1. Analyze the message for:
   - COMMANDS: Explicit instructions that MUST be followed (e.g. "always respond in Spanish", "never use emojis")
   - TOPICS: Topics of interest or expertise (with any context about their interest level)
   - PERSONAL INFO: Any personal information shared
   - COMMUNICATION STYLE: How the user prefers to communicate
   - CONTEXT: Any other relevant information

2. Update the knowledge base sections:
   - Commands section should be authoritative and clear
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
   - Note any conflicts or ambiguities"""

        response = requests.post(
            settings.LLM_API_URL,
            json={
                "model": settings.LLM_MODEL_NAME,
                "prompt": knowledge_prompt,
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
        
        # Now analyze the entire knowledge text to rank topics
        topic_prompt = f"""Analyze the entire knowledge base and extract ranked topics based on the user's overall interests and engagement.
Return a JSON array of topics with their rankings (0.0 to 1.0, where 1.0 is highest interest).
Format: {{"topics": [
    {{"name": "AI", "description": "Strong interest in artificial intelligence and machine learning", "rank": 0.95}},
    {{"name": "Art", "description": "Digital art and generative AI art creation", "rank": 0.8}}
]}}

Knowledge Base:
{new_knowledge_text}

Instructions:
1. Extract ALL topics mentioned throughout the knowledge base
2. For each topic:
   - NAME: Use a single word or acronym (e.g. "AI", "Python", "Art")
   - DESCRIPTION: Add a brief description explaining the context and specific areas of interest
   - RANK: Assign a rank from 0.0 to 1.0

3. Rank topics based on:
   - Frequency of mentions
   - Explicit statements of interest
   - Emotional connection to the topic
   - Demonstrated expertise or knowledge
   - Recency of mentions
   - Context of mentions (e.g. mentioned in commands vs casual reference)
   
4. Topic Ranking Guidelines:
   - 0.9 - 1.0: Core interests, explicitly stated passions, or professional expertise
   - 0.7 - 0.8: Strong interests, frequently discussed or actively pursued
   - 0.5 - 0.6: Moderate interests, mentioned multiple times with positive engagement
   - 0.3 - 0.4: Casual interests, mentioned occasionally or with neutral engagement
   - 0.1 - 0.2: Minor interests, mentioned in passing or with limited engagement

5. Topic Name Guidelines:
   - Use single words where possible (e.g. "Art" not "Digital Art")
   - Use widely recognized acronyms (e.g. "AI" for Artificial Intelligence)
   - For technical topics, use standard terminology (e.g. "Python", "React")
   - Capitalize appropriately (e.g. "JavaScript", "Art", "Science")
   - Avoid compound words or phrases
   - If a concept needs multiple words, use the description field to clarify

6. Description Guidelines:
   - Be specific about the user's relationship with the topic
   - Include relevant subtopics or specific areas of interest
   - Mention skill level or expertise if known
   - Note any specific preferences or focus areas
   - Keep to one sentence, maximum 100 characters

7. Ensure Consistency:
   - Use standard terminology for technical topics
   - Combine related interests under main topic names
   - Use the description to capture nuance and detail
   - Maintain professional terminology where appropriate

8. Return only the JSON array, no other text"""

        # Get topic rankings
        topic_response = requests.post(
            settings.LLM_API_URL,
            json={
                "model": settings.LLM_MODEL_NAME,
                "prompt": topic_prompt,
                "stream": False
            }
        )
        
        if topic_response.status_code != 200:
            error_msg = f"Error from LLM API (topics): {topic_response.status_code} - {topic_response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)

        try:
            topic_data = json.loads(topic_response.json()["response"])
            knowledge_base.topics = topic_data
            logger.info(f"Updated topics: {topic_data}")
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse topic response: {e}")
            # Continue even if topic parsing fails - the knowledge text was still updated
        
        knowledge_base.save()
        logger.info(f"Updated knowledge base for user {user.id}")
        
        return knowledge_base

    @classmethod
    def get_knowledge_as_context(cls, user) -> str:
        """Get the knowledge base in a format suitable for AI context."""
        knowledge_base = cls.get_or_create_knowledge_base(user)
        return knowledge_base.knowledge_text
