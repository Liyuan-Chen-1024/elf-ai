from celery import shared_task
from django.contrib.auth import get_user_model
import logging

from .services import KnowledgeBaseService

User = get_user_model()
logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, autoretry_for=(Exception,), retry_backoff=True)
def update_knowledge_base_from_message(self, user_id: int, message_id: int):
    """Update a user's knowledge base with information from a message asynchronously."""
    try:
        from apps.chat.models import Message  # Import here to avoid circular import
        
        logger.info(f"Starting knowledge base update for user {user_id} from message {message_id}")
        user = User.objects.get(id=user_id)
        message = Message.objects.get(id=message_id)
        
        knowledge_base = KnowledgeBaseService.update_knowledge_base_from_message(
            user=user,
            message=message
        )
        logger.info(f"Successfully updated knowledge base for user {user_id}")
        
        # Return a serializable dictionary instead of the model instance
        return {
            'id': str(knowledge_base.id),
            'user_id': str(knowledge_base.user.id),
            'topics': knowledge_base.topics,
            'preferences': knowledge_base.preferences,
            'knowledge_text': knowledge_base.knowledge_text,
            'version': float(knowledge_base.version),
            'knowledge_version': knowledge_base.knowledge_version,
            'updated_at': knowledge_base.updated_at.isoformat(),
            'created_at': knowledge_base.created_at.isoformat(),
        }
    except Exception as e:
        logger.error(f"Failed to update knowledge base for user {user_id}: {str(e)}")
        if self.request.retries >= self.max_retries:
            logger.error(f"Max retries reached for user {user_id}, giving up")
            raise
        raise self.retry(exc=e) 