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
    "apps.shows",
    "apps.dashboard",
    "apps.chat",
    "apps.agent",
]


MIDDLEWARE: List[str] = [
    # Security and core middleware first
    "django.middleware.security.SecurityMiddleware",
    "config.middleware.SecurityHeadersMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    # Rate limiting before session/auth
    "config.middleware.RateLimitMiddleware",
    # Session and authentication
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Logging and tracing last
    "config.middleware.RequestIDMiddleware",
    "config.middleware.StructLogMiddleware",
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

WSGI_APPLICATION: str = "config.wsgi.application"

# Database
DATABASES: Dict[str, Dict[str, Any]] = {
    "default": env.db(
        "DATABASE_URL", default="mysql://elfai:elfai@localhost:3306/elfai"
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
        "anon": "60/hour",
        "user": "1000/day",
    },
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "DEFAULT_CONTENT_NEGOTIATION_CLASS": "apps.core.negotiation.SSEContentNegotiation",
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
RATE_LIMIT_WINDOW: int = env.int("RATE_LIMIT_WINDOW", 10)  # window size in seconds


# LLM Configuration
LLM_MODEL_NAME = env("LLM_MODEL_NAME", default="gemma3:1b")
LLM_API_URL = env("LLM_API_URL", default="http://localhost:11400/api/generate")
