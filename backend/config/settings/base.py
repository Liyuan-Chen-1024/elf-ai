"""Base settings for Django project."""

from pathlib import Path
from typing import Any, Dict, List, Union

import environ
import structlog

env = environ.Env()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

# Take environment variables from .env file
environ.Env.read_env(BASE_DIR / ".env")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY: str = env("DJANGO_SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG: bool = env.bool("DJANGO_DEBUG", False)

ALLOWED_HOSTS: List[str] = env.list("DJANGO_ALLOWED_HOSTS", default=[])

# Application definition
INSTALLED_APPS: List[str] = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party apps
    "rest_framework",
    "rest_framework.authtoken",
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    "health_check",
    "health_check.db",
    "health_check.cache",
    "health_check.storage",
    "health_check.contrib.migrations",
    "health_check.contrib.psutil",
    "health_check.contrib.redis",
    # Local apps
    "apps.core",
    "apps.core.user",
    "apps.chat",
    "django_celery_results",
    "django_celery_beat",
]


MIDDLEWARE: List[str] = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF: str = "config.urls"

TEMPLATES: List[Dict[str, Any]] = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            BASE_DIR / "apps" / "templates",
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# Database
DATABASES: Dict[str, Dict[str, Any]] = {
    "default": env.db(
        "DATABASE_URL", default="postgresql://elfai:elfai@localhost:5432/elfai"
    ),
}

# Cache
CACHES: Dict[str, Dict[str, Any]] = {
    "default": env.cache("REDIS_URL", default="redis://localhost:6379/1"),
}

# Password validation
AUTH_PASSWORD_VALIDATORS: List[Dict[str, str]] = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE: str = env("LANGUAGE_CODE", default="en-us")
TIME_ZONE: str = env("TIME_ZONE", default="UTC")
USE_I18N: bool = True
USE_TZ: bool = True

# Static files (CSS, JavaScript, Images)
STATIC_URL: str = env("STATIC_URL", default="static/")
STATIC_ROOT: Path = BASE_DIR / "staticfiles"
STATICFILES_STORAGE: str = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media files
MEDIA_URL: str = env("MEDIA_URL", default="media/")
MEDIA_ROOT: Path = BASE_DIR / "media"

# Default primary key field type
DEFAULT_AUTO_FIELD: str = "django.db.models.BigAutoField"

# Django REST Framework configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "600/hour",
        "user": "5000/hour",
    },
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}

# Spectacular settings
SPECTACULAR_SETTINGS: Dict[str, Any] = {
    "TITLE": env("API_TITLE", default="Elf AI API"),
    "DESCRIPTION": env("API_DESCRIPTION", default="API documentation"),
    "VERSION": env("API_VERSION", default="1.0.0"),
    "SERVE_INCLUDE_SCHEMA": False,
    "SWAGGER_UI_SETTINGS": {
        "deepLinking": True,
    },
}

# CORS settings
CORS_ALLOWED_ORIGINS: List[str] = env.list("CORS_ALLOWED_ORIGINS", default=[])
CORS_ALLOW_CREDENTIALS: bool = True

# Security settings
SECURE_BROWSER_XSS_FILTER: bool = True
SECURE_CONTENT_TYPE_NOSNIFF: bool = True
X_FRAME_OPTIONS: str = "DENY"
SECURE_REFERRER_POLICY: str = "same-origin"

# Email settings
EMAIL_BACKEND: str = env(
    "DJANGO_EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST: str = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT: int = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS: bool = True
EMAIL_HOST_USER: str = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD: str = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL: str = env("DEFAULT_FROM_EMAIL", default="noreply@elfai.frecar.no")

# Logging Configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "plain": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.dev.ConsoleRenderer(colors=False),
            "foreign_pre_chain": [
                structlog.contextvars.merge_contextvars,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S"),
            ],
        },
    },
    "handlers": {
        "default": {
            "level": env("DJANGO_LOG_LEVEL", default="INFO"),
            "class": "logging.StreamHandler",
            "formatter": "plain",
        },
    },
    "loggers": {
        "": {
            "handlers": ["default"],
            "level": env("DJANGO_LOG_LEVEL", default="INFO"),
            "propagate": True,
        },
        # Silence noisy loggers
        "django.server": {"level": "WARNING"},
        "django.security.DisallowedHost": {"level": "ERROR"},
    },
}

# Structlog Configuration
STRUCTLOG = {
    "processors": [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.filter_by_level,
        structlog.processors.TimeStamper(fmt="%Y-%m-%d %H:%M:%S"),
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.ExceptionPrettyPrinter(),
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

# Logging control flags
DJANGO_LOG_LEVEL = env("DJANGO_LOG_LEVEL", default="INFO")
DJANGO_LOG_REQUEST_BODY = env.bool("DJANGO_LOG_REQUEST_BODY", default=False)
DJANGO_LOG_RESPONSE_BODY = env.bool("DJANGO_LOG_RESPONSE_BODY", default=False)

# Health Check
HEALTH_CHECK: Dict[str, Union[int, float]] = {
    "DISK_USAGE_MAX": 90,  # percent
    "MEMORY_MIN": 100,  # in MB
}

# Rate limiting
RATE_LIMIT_ENABLED: bool = env.bool("RATE_LIMIT_ENABLED", True)
RATE_LIMIT_REQUESTS: int = env.int("RATE_LIMIT_REQUESTS", 500000)  # requests per window
RATE_LIMIT_WINDOW: int = env.int("RATE_LIMIT_WINDOW", 1)  # window size in seconds


# LLM Configuration
LLM_API_URL = env("LLM_API_URL", default="https://llm.local.carlsen.io:8080/v1")
LLM_API_KEY = env("LLM_API_KEY", default="")
LLM_VERIFY_SSL = env.bool("LLM_VERIFY_SSL", default=True)
LLM_MODEL_NAME = env("LLM_MODEL_NAME", default="")

# Celery Configuration
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://redis:6379/0")
CELERY_RESULT_BACKEND = "django-db"
CELERY_CACHE_BACKEND = "django-cache"
CELERY_ACCEPT_CONTENT = ["application/json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
CELERY_WORKER_CONCURRENCY = env.int("CELERY_WORKER_CONCURRENCY", default=2)
CELERY_WORKER_MAX_TASKS_PER_CHILD = env.int(
    "CELERY_WORKER_MAX_TASKS_PER_CHILD", default=100
)
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True  # New setting for Celery 6.0
CELERY_SECURITY_KEY = env(
    "DJANGO_SECRET_KEY"
)  # Use Django's secret key for Celery security

# Celery Beat Settings
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
