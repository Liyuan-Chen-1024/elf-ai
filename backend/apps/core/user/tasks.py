import json
import logging
from typing import Any, Dict

from django.contrib.auth import get_user_model

from celery import shared_task

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    autoretry_for=(Exception,),
    retry_backoff=True,
    soft_time_limit=60,
    time_limit=90,
)
def update_knowledge_base_from_message(self, user_id: int, message_id: int):
    pass
