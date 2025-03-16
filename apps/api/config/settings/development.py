"""Development settings for Django project."""
from typing import Dict, List, Any

from .base import *  # noqa

# Development settings
DEBUG: bool = True
ALLOWED_HOSTS: List[str] = ['*']

# Add development apps
INSTALLED_APPS += [  # noqa
    'django_extensions',
    'debug_toolbar',
]

# Add development middleware
MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa

# Debug toolbar settings
INTERNAL_IPS: List[str] = ['127.0.0.1', '172.17.0.1']

# Disable security settings in development
SECURE_SSL_REDIRECT: bool = False
SESSION_COOKIE_SECURE: bool = False
CSRF_COOKIE_SECURE: bool = False

# Email backend for development
EMAIL_BACKEND: str = 'django.core.mail.backends.console.EmailBackend'

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{asctime} [{levelname:8}] {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        '': {  # Root logger
            'handlers': ['console'],
            'level': 'INFO',
        },
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.server': {  # Server requests
            'handlers': ['console'],
            'level': 'WARNING',  # Only log warnings and above for server requests
            'propagate': False,
        },
        'django.utils.autoreload': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.core.health_checks': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'django.request': {  # Request/response logging
            'handlers': ['console'],
            'level': 'WARNING',  # Only log warnings and above
            'propagate': False,
        },
        'django.db.backends': {  # Database queries
            'handlers': ['console'],
            'level': 'WARNING',  # Only log warnings and above
            'propagate': False,
        },
        'django.security': {  # Security warnings
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.template': {  # Template rendering
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# Disable Django's default 404 logging
LOGGING['loggers']['django.middleware'] = {
    'handlers': ['console'],
    'level': 'WARNING',
    'propagate': False,
}

# Redis configuration
REDIS_URL = 'redis://redis:6379/0'

# Cache - use Redis in development
CACHES: Dict[str, Dict[str, str]] = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
    }
}

# Health check configuration
HEALTH_CHECK: Dict[str, Any] = {
    'DISK_USAGE_MAX': 90,  # percent
    'REDIS_URL': REDIS_URL,
    'REDIS_DB': 0,  # Explicitly set Redis database
    'REDIS_TIMEOUT': 2,  # seconds
} 