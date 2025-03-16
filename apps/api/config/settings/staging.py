"""Staging settings for Django project."""
from typing import Dict, List, Any

from .production import *  # noqa

# Override production settings for staging environment
ALLOWED_HOSTS: List[str] = env.list('DJANGO_ALLOWED_HOSTS', default=['staging.jarvis.frecar.no'])

# Staging-specific logging
LOGGING['handlers']['file']['filename'] = '/var/log/jarvis/staging.log'  # noqa

# Email settings for staging (override production settings)
EMAIL_BACKEND: str = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL: str = 'noreply@staging.jarvis.frecar.no'

# Add staging-specific apps
INSTALLED_APPS += ['django_extensions']  # noqa

# More verbose logging in staging
LOGGING['loggers']['']['level'] = 'DEBUG'  # noqa
LOGGING['loggers']['django']['level'] = 'DEBUG'  # noqa

# CSRF settings
CSRF_TRUSTED_ORIGINS: List[str] = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['https://staging.jarvis.frecar.no']
) 