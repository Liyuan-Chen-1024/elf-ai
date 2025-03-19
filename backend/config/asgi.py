"""ASGI config for project.

This module configures the ASGI application with support for:
- HTTP requests (Django views)
- WebSocket connections (Chat)
- Background tasks
- Middleware for authentication and monitoring
"""

import os

from django.core.asgi import get_asgi_application

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from opentelemetry.instrumentation.asgi import OpenTelemetryMiddleware

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Initialize telemetry before application starts
from config.telemetry import setup_telemetry

setup_telemetry()

# Import websocket URLs after Django setup to avoid import issues
from chat import routing as chat_routing

# Configure the ASGI application with protocol routing
application = ProtocolTypeRouter(
    {
        # HTTP requests handled by Django
        "http": OpenTelemetryMiddleware(get_asgi_application()),
        # WebSocket connections with authentication and origin validation
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(chat_routing.websocket_urlpatterns))
        ),
    }
)
