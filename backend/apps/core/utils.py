"""Core utility functions and helpers."""

import hashlib
from typing import Any, Callable, Dict, List, Optional, TypeVar, Union, cast

from django.conf import settings
from django.core.cache import cache
from django.db.models import Model
from django.utils.text import slugify

T = TypeVar("T")


def generate_unique_slug(instance: Model, value: str, max_length: int = 50) -> str:
    """Generate a unique slug for a model instance.

    Args:
        instance: Model instance to generate slug for
        value: String value to base slug on
        max_length: Maximum length of generated slug

    Returns:
        Unique slug string
    """
    slug = orig = slugify(value)[:max_length]

    # Only query for existing slugs if this is a new instance
    if not instance.pk:
        ModelClass = instance.__class__

        # Try appending a number to the slug until we find a unique one
        counter = 1
        while ModelClass.objects.filter(slug=slug).exists():
            slug_length = len(orig)
            suffix = f"-{counter}"
            if slug_length + len(suffix) > max_length:
                orig = orig[: max_length - len(suffix)]
            slug = f"{orig}{suffix}"
            counter += 1

    return slug


def get_cache_key(prefix: str, *args: Any) -> str:
    """Generate a cache key with prefix and arguments.

    Args:
        prefix: Cache key prefix
        *args: Additional arguments to include in key

    Returns:
        Cache key string
    """
    key_parts = [prefix] + [str(arg) for arg in args]
    key = ":".join(key_parts)

    # Hash the key if it exceeds max length
    if len(key) > settings.CACHE_KEY_MAX_LENGTH:
        key = f"{prefix}:{hashlib.md5(key.encode()).hexdigest()}"

    return key


def cache_get_or_set(
    key: str, func: Callable[[], T], timeout: Optional[int] = None, **kwargs: Any
) -> T:
    """Get value from cache or compute and cache it.

    Args:
        key: Cache key
        func: Function to compute value if not in cache
        timeout: Cache timeout in seconds
        **kwargs: Additional arguments for cache.get_or_set()

    Returns:
        Cached or computed value
    """
    return cache.get_or_set(
        key, func, timeout or settings.CACHE_DEFAULT_TIMEOUT, **kwargs
    )
