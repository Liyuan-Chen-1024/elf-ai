"""Production settings for Django project."""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import structlog

from .base import *  # noqa

# Production settings
DEBUG: bool = False
ALLOWED_HOSTS: List[str] = env.list("DJANGO_ALLOWED_HOSTS", default=["elfai.frecar.no"])

# Security settings
SECURE_SSL_REDIRECT: bool = True
SECURE_HSTS_SECONDS: int = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS: bool = True
SECURE_HSTS_PRELOAD: bool = True
SESSION_COOKIE_SECURE: bool = True
CSRF_COOKIE_SECURE: bool = True
SECURE_PROXY_SSL_HEADER: Tuple[str, str] = ("HTTP_X_FORWARDED_PROTO", "https")

# CSRF settings
CSRF_TRUSTED_ORIGINS: List[str] = env.list(
    "CSRF_TRUSTED_ORIGINS", default=["https://elfai.frecar.no"]
)

# Database - use environment settings
DATABASES: Dict[str, Dict[str, Any]] = {
    "default": env.db(
        "DATABASE_URL", default="mysql://elfai:elfai@localhost:3306/elfai"
    )
}

# Cache - use Redis in production
CACHES: Dict[str, Dict[str, Any]] = {
    "default": env.cache("REDIS_URL", default="redis://redis:6379/1")
}

# Static files
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media files
MEDIA_ROOT: Path = env.path("MEDIA_ROOT", default=BASE_DIR / "media")

# Production logging configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.processors.JSONRenderer(),
            "foreign_pre_chain": [
                structlog.contextvars.merge_contextvars,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.processors.TimeStamper(fmt="iso"),
            ],
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "level": env("DJANGO_LOG_LEVEL", default="INFO"),
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": env("DJANGO_LOG_FILE", default="/var/log/elfai/app.log"),
            "maxBytes": 1024 * 1024 * 10,  # 10 MB
            "backupCount": 5,
            "formatter": "json",
            "level": env("DJANGO_LOG_LEVEL", default="INFO"),
        },
    },
    "loggers": {
        "": {
            "handlers": ["console", "file"],
            "level": env("DJANGO_LOG_LEVEL", default="INFO"),
            "propagate": True,
        },
        # Silence noisy loggers in production
        "django.server": {"level": "WARNING"},
        "django.security.DisallowedHost": {"level": "ERROR"},
    },
}

# Production-specific structlog configuration
STRUCTLOG = {
    "processors": [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.filter_by_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        # Filter out health check and static file requests
        lambda logger, name, event_dict: (
            None
            if (
                event_dict.get("path", "").startswith(
                    ("/static/", "/admin/", "/media/", "/admin/jsi18n/", "/health/")
                )
                or (
                    event_dict.get("event") in ["request_started", "request_finished"]
                    and not event_dict.get("status_code", 200) >= 400
                )
            )
            else event_dict
        ),
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ],
    "logger_factory": structlog.stdlib.LoggerFactory(),
    "wrapper_class": structlog.stdlib.BoundLogger,
    "cache_logger_on_first_use": True,
}

# Production log level - can be overridden by environment variable
DJANGO_LOG_LEVEL = env("DJANGO_LOG_LEVEL", default="INFO")

# Disable request/response body logging in production for security
DJANGO_LOG_REQUEST_BODY = False
DJANGO_LOG_RESPONSE_BODY = False

# Email backend for production
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@elfai.frecar.no")

# Storage paths
STORAGE_PATHS: List[str] = env.list(
    "STORAGE_PATHS", default=["/nstore1/", "/nstore2/", "/nstore3/"]
)

# Transmission settings
TRANSMISSION_HOST: str = env("TRANSMISSION_HOST", default="192.168.1.10")
TRANSMISSION_PORT: int = env.int("TRANSMISSION_PORT", default=9091)
TRANSMISSION_USERNAME: Optional[str] = env("TRANSMISSION_USERNAME", default=None)
TRANSMISSION_PASSWORD: Optional[str] = env("TRANSMISSION_PASSWORD", default=None)
