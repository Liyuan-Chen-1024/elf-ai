import uuid
from datetime import datetime

from django.db import models


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
