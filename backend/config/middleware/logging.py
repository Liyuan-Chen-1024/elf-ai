"""Middleware for request logging and tracing."""

import json
import time
import uuid
from typing import Any, Callable, Dict, Optional

from django.conf import settings
from django.http import HttpRequest, HttpResponse

from opentelemetry import trace
from structlog import get_logger
from structlog.typing import FilteringBoundLogger

from apps.core.logging import (
    get_request_logger,
    log_request_finished,
    log_request_started,
)

logger: FilteringBoundLogger = get_logger(__name__)
tracer = trace.get_tracer(__name__)


class RequestIDMiddleware:
    """Middleware that adds a request ID to each request.

    This middleware generates a unique ID for each request and adds it to both
    the request object and response headers. This is useful for request tracing
    and correlating log entries across services.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Initialize the middleware.

        Args:
            get_response: The next middleware or view in the chain
        """
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process the request.

        Args:
            request: The incoming request

        Returns:
            The response from the next middleware or view
        """
        request_id = str(uuid.uuid4())
        request.request_id = request_id  # type: ignore
        response = self.get_response(request)
        response["X-Request-ID"] = request_id
        return response


class StructLogMiddleware:
    """Middleware that adds structured logging to requests."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Skip logging for certain paths
        if request.path.startswith(
            ("/static/", "/admin/static/", "/media/", "/admin/jsi18n/", "/health/")
        ):
            return self.get_response(request)

        # Get logger with request context
        logger = get_request_logger(request)

        # Log request start
        log_request_started(logger, request)

        # Process request and measure duration
        start_time = time.perf_counter()
        try:
            response = self.get_response(request)
            duration_ms = (time.perf_counter() - start_time) * 1000

            # Log request completion
            log_request_finished(logger, request, response, duration_ms)

            return response

        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000

            # Log exception with full context
            logger.exception(
                "http_request_failed",
                exc_info=e,
                duration_ms=round(duration_ms, 2),
                error_type=type(e).__name__,
            )
            raise

    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get the client IP address from the request.

        Args:
            request: The HTTP request

        Returns:
            The client IP address
        """
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "")

    def _get_request_body(self, request: HttpRequest) -> Optional[str]:
        """Get the request body if available.

        Args:
            request: The HTTP request

        Returns:
            The request body as a string, or None if not available
        """
        if not request.body:
            return None

        content_type = request.content_type.lower()

        try:
            if "application/json" in content_type:
                return json.loads(request.body.decode("utf-8"))
            elif "application/x-www-form-urlencoded" in content_type:
                return dict(request.POST.items())
            elif "multipart/form-data" in content_type:
                return "<multipart>"
            else:
                return request.body.decode("utf-8")[:1000]
        except (json.JSONDecodeError, UnicodeDecodeError):
            return "<binary>"
