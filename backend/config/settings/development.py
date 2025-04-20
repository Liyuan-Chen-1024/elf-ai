"""Development settings for Django project."""

from typing import Any, Dict, List

import structlog

from .base import *  # noqa

# Development settings
DEBUG: bool = True
ALLOWED_HOSTS: List[str] = ["*"]

# CORS Settings - allow all origins for development
CORS_ALLOW_ALL_ORIGINS: bool = True
CORS_ALLOW_CREDENTIALS: bool = True
CORS_ORIGIN_ALLOW_ALL: bool = True  # Add this for older versions of django-cors-headers
# Override CORS_ALLOWED_ORIGINS from base.py
CORS_ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
]

# CSRF Settings
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://localhost:8000",
]
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = (
    "Lax"  # Consider using "None" for cross-site requests in development
)
CSRF_COOKIE_NAME = "csrftoken"
CSRF_HEADER_NAME = "HTTP_X_CSRFTOKEN"
CSRF_USE_SESSIONS = False  # Don't store CSRF in sessions
CSRF_COOKIE_DOMAIN = None  # Allow subdomain access

# Debug CSRF issues in development
CSRF_FAILURE_VIEW = "django.views.csrf.csrf_failure"

SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True

# Add all CORS-related headers
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_EXPOSE_HEADERS = [
    "content-type",
    "content-encoding",
    "content-length",
    "connection",
    "cache-control",
]

# Add SSE-specific settings
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# Ensure long-lived connections are allowed
CORS_PREFLIGHT_MAX_AGE = 86400  # 24 hours in seconds

# Add development apps
INSTALLED_APPS += [  # noqa
    "django_extensions",
]

# Disable security settings in development
SECURE_SSL_REDIRECT: bool = False

# Email backend for development
EMAIL_BACKEND: str = "django.core.mail.backends.console.ConsoleBackend"

# Redis configuration
REDIS_URL = "redis://redis:6379/0"

# Cache - use Redis in development
CACHES: Dict[str, Dict[str, str]] = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": REDIS_URL,
    }
}

# Development logging configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "null": {
            "class": "logging.NullHandler",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["null"],
            "level": "WARNING",
        },
    },
}

# Override global log level for development
DJANGO_LOG_LEVEL = "WARNING"

# Development-specific structlog configuration - inherits processors from base
STRUCTLOG = {
    "processors": [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        # Filter out noisy logs
        lambda logger, name, event_dict: (
            None
            if (
                event_dict.get("path", "").startswith(
                    (
                        "/static/",
                        "/admin/static/",
                        "/media/",
                        "/admin/jsi18n/",
                        "/health/",
                    )
                )
                or (
                    event_dict.get("event") == "http_request_finished"
                    and event_dict.get("status_code", 200) < 400
                    and event_dict.get("duration_ms", 0)
                    < 1000  # Only log slow requests
                )
            )
            else event_dict
        ),
        structlog.processors.JSONRenderer(),
    ],
    "context_class": dict,
    "logger_factory": structlog.stdlib.LoggerFactory(),
    "wrapper_class": structlog.stdlib.BoundLogger,
    "cache_logger_on_first_use": True,
}

# Only log request/response bodies in debug mode when explicitly enabled
DJANGO_LOG_REQUEST_BODY = False
DJANGO_LOG_RESPONSE_BODY = False

# Health check configuration
HEALTH_CHECK: Dict[str, Any] = {
    "DISK_USAGE_MAX": 90,  # percent
    "REDIS_URL": REDIS_URL,
    "REDIS_DB": 0,  # Explicitly set Redis database
    "REDIS_TIMEOUT": 2,  # seconds
}
