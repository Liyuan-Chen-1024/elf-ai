"""Type definitions for models in the media app."""
from typing import TypeVar
from django.db.models import QuerySet

from .models import MediaFile, TVShow

# Database types
TVShowQuerySet = QuerySet['TVShow']
MediaFileQuerySet = QuerySet['MediaFile']

# Type variables for models
TVShowType = TypeVar('TVShowType', bound='TVShow')
MediaFileType = TypeVar('MediaFileType', bound='MediaFile') 