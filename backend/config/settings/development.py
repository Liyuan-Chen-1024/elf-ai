"""Development settings for Django project."""

from typing import Any, Dict, List

from .base import *  # noqa

# Development settings
DEBUG: bool = True
ALLOWED_HOSTS: List[str] = ["*"]

# CORS Settings - allow all origins for development
CORS_ALLOW_ALL_ORIGINS: bool = True
CORS_ALLOW_CREDENTIALS: bool = True
CORS_ORIGIN_ALLOW_ALL: bool = True  # Add this for older versions of django-cors-headers
# Override CORS_ALLOWED_ORIGINS from base.py
CORS_ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
# Add all CORS-related headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'access-control-allow-origin',
    'cache-control',
    'connection',
    'content-encoding',
    'content-length',
    'host',
    'pragma',
    'referer',
    'sec-fetch-dest',
    'sec-fetch-mode',
    'sec-fetch-site',
    'last-event-id',  # Required for SSE
]

CORS_EXPOSE_HEADERS = [
    'content-type',
    'content-encoding',
    'content-length',
    'connection',
    'cache-control',
]

# Add SSE-specific settings
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Ensure long-lived connections are allowed
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours in seconds

# Add development apps
INSTALLED_APPS += [  # noqa
    "django_extensions",
]

# Add custom middleware
MIDDLEWARE.insert(0, "config.middleware.cors.CustomCorsMiddleware")  # Add custom CORS middleware

# Disable security settings in development
SECURE_SSL_REDIRECT: bool = False
SESSION_COOKIE_SECURE: bool = False
CSRF_COOKIE_SECURE: bool = False

# Email backend for development
EMAIL_BACKEND: str = "django.core.mail.backends.console.EmailBackend"

# Increased rate limits for development
RATE_LIMIT_ENABLED: bool = True
RATE_LIMIT_REQUESTS: int = 180  # 3 requests per second
RATE_LIMIT_WINDOW: int = 60  # window size in seconds

# Also increase REST Framework rate limits
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {  # noqa
    "anon": "1000/day",  # Increased from 100/day
    "user": "5000/day",  # Increased from 1000/day
}

# Logging configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{asctime} [{levelname:8}] {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "": {  # Root logger
            "handlers": ["console"],
            "level": "INFO",
        },
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.server": {  # Server requests
            "handlers": ["console"],
            "level": "WARNING",  # Only log warnings and above for server requests
            "propagate": False,
        },
        "django.utils.autoreload": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "apps.core.health_checks": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
        "django.request": {  # Request/response logging
            "handlers": ["console"],
            "level": "WARNING",  # Only log warnings and above
            "propagate": False,
        },
        "django.db.backends": {  # Database queries
            "handlers": ["console"],
            "level": "WARNING",  # Only log warnings and above
            "propagate": False,
        },
        "django.security": {  # Security warnings
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "django.template": {  # Template rendering
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# Disable Django's default 404 logging
LOGGING["loggers"]["django.middleware"] = {
    "handlers": ["console"],
    "level": "WARNING",
    "propagate": False,
}

# Redis configuration
REDIS_URL = "redis://redis:6379/0"

# Cache - use Redis in development
CACHES: Dict[str, Dict[str, str]] = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# Health check configuration
HEALTH_CHECK: Dict[str, Any] = {
    "DISK_USAGE_MAX": 90,  # percent
    "REDIS_URL": REDIS_URL,
    "REDIS_DB": 0,  # Explicitly set Redis database
    "REDIS_TIMEOUT": 2,  # seconds
}
