"""Core signal handlers."""

from typing import Any, Type

from django.db.models import Model
from django.db.models.signals import pre_save
from django.dispatch import receiver

from .utils import generate_unique_slug


@receiver(pre_save)
def generate_slug(sender: Type[Model], instance: Model, **kwargs: Any) -> None:
    """Generate slug for model instances with slug field.

    Args:
        sender: Model class
        instance: Model instance being saved
        **kwargs: Additional signal arguments
    """
    if hasattr(instance, "slug") and hasattr(instance, "get_slug_field_value"):
        # Only generate slug if it's empty or this is a new instance
        if not instance.slug or not instance.pk:
            value = instance.get_slug_field_value()
            if value:
                instance.slug = generate_unique_slug(instance, value)


@receiver(pre_save)
def update_modified_by(sender: Type[Model], instance: Model, **kwargs: Any) -> None:
    """Update modified_by field if present.

    Args:
        sender: Model class
        instance: Model instance being saved
        **kwargs: Additional signal arguments
    """
    request = getattr(instance, "_request", None)
    if request and hasattr(instance, "modified_by_id"):
        user_id = getattr(request.user, "id", None)
        if user_id:
            instance.modified_by_id = user_id
