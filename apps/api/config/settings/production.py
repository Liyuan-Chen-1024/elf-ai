"""Production settings for Django project."""
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional

from .base import *  # noqa

# Production settings
DEBUG: bool = False
ALLOWED_HOSTS: List[str] = env.list('DJANGO_ALLOWED_HOSTS', default=['jarvis.frecar.no'])

# Security settings
SECURE_SSL_REDIRECT: bool = True
SECURE_HSTS_SECONDS: int = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS: bool = True
SECURE_HSTS_PRELOAD: bool = True
SESSION_COOKIE_SECURE: bool = True
CSRF_COOKIE_SECURE: bool = True
SECURE_PROXY_SSL_HEADER: Tuple[str, str] = ('HTTP_X_FORWARDED_PROTO', 'https')

# CSRF settings
CSRF_TRUSTED_ORIGINS: List[str] = env.list('CSRF_TRUSTED_ORIGINS', default=['https://jarvis.frecar.no'])

# Database - use environment settings
DATABASES: Dict[str, Dict[str, Any]] = {
    'default': env.db(
        'DATABASE_URL',
        default='mysql://jarvis:jarvis@localhost:3306/jarvis'
    )
}

# Cache - use Redis in production
CACHES: Dict[str, Dict[str, Any]] = {
    'default': env.cache(
        'REDIS_URL',
        default='redis://redis:6379/1'
    )
}

# Static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_ROOT: Path = env.path('MEDIA_ROOT', default=BASE_DIR / 'media')

# Logging - use file handler in production
LOGGING['handlers']['file'] = {  # noqa
    'class': 'logging.handlers.RotatingFileHandler',
    'filename': '/var/log/jarvis/app.log',
    'maxBytes': 1024 * 1024 * 10,  # 10 MB
    'backupCount': 5,
    'formatter': 'json',
}
LOGGING['loggers']['']['handlers'] = ['file', 'console']  # noqa

# Email backend for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = True
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@jarvis.frecar.no')

# Storage paths
STORAGE_PATHS: List[str] = env.list('STORAGE_PATHS', default=['/nstore1/', '/nstore2/', '/nstore3/'])

# Transmission settings
TRANSMISSION_HOST: str = env('TRANSMISSION_HOST', default='192.168.1.10')
TRANSMISSION_PORT: int = env.int('TRANSMISSION_PORT', default=9091)
TRANSMISSION_USERNAME: Optional[str] = env('TRANSMISSION_USERNAME', default=None)
TRANSMISSION_PASSWORD: Optional[str] = env('TRANSMISSION_PASSWORD', default=None) 