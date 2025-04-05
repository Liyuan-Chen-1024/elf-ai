"""ASGI config for project.

This module configures the ASGI application with support for:
- HTTP requests (Django views)
- WebSocket connections (Chat)
- Background tasks
- Middleware for authentication and monitoring
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

application = get_asgi_application()