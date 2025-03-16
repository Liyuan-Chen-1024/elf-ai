"""Core constants and settings."""

from enum import Enum
from typing import Final

# Cache settings
CACHE_KEY_MAX_LENGTH: Final[int] = 250
CACHE_DEFAULT_TIMEOUT: Final[int] = 300  # 5 minutes
CACHE_LONG_TIMEOUT: Final[int] = 86400  # 24 hours

# File upload settings
MAX_UPLOAD_SIZE: Final[int] = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES: Final[tuple[str, ...]] = (
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
)
ALLOWED_DOCUMENT_TYPES: Final[tuple[str, ...]] = (
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
)

# Pagination settings
DEFAULT_PAGE_SIZE: Final[int] = 20
MAX_PAGE_SIZE: Final[int] = 100

# Date and time formats
DATE_FORMAT: Final[str] = "%Y-%m-%d"
DATETIME_FORMAT: Final[str] = "%Y-%m-%d %H:%M:%S"
ISO_DATETIME_FORMAT: Final[str] = "%Y-%m-%dT%H:%M:%S%z"


# Common status choices
class Status(str, Enum):
    """Common status choices."""

    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"
    DELETED = "deleted"

    @classmethod
    def choices(cls) -> list[tuple[str, str]]:
        """Get choices for Django model fields.

        Returns:
            List of (value, label) tuples
        """
        return [(status.value, status.name.title()) for status in cls]


# Common priority choices
class Priority(str, Enum):
    """Common priority choices."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

    @classmethod
    def choices(cls) -> list[tuple[str, str]]:
        """Get choices for Django model fields.

        Returns:
            List of (value, label) tuples
        """
        return [(priority.value, priority.name.title()) for priority in cls]


# Common state transitions
STATE_TRANSITIONS: Final[dict[str, list[str]]] = {
    Status.DRAFT.value: [Status.PENDING.value, Status.DELETED.value],
    Status.PENDING.value: [Status.ACTIVE.value, Status.INACTIVE.value],
    Status.ACTIVE.value: [Status.INACTIVE.value, Status.ARCHIVED.value],
    Status.INACTIVE.value: [Status.ACTIVE.value, Status.ARCHIVED.value],
    Status.ARCHIVED.value: [Status.ACTIVE.value],
    Status.DELETED.value: [],
}
