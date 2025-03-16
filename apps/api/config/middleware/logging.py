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
    """Middleware that adds structured logging to each request.

    This middleware logs request/response details using structlog and adds
    OpenTelemetry tracing. It captures timing, status codes, and error details
    for each request.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Initialize the middleware.

        Args:
            get_response: The next middleware or view in the chain
        """
        self.get_response = get_response
        self._logger: FilteringBoundLogger = logger

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process the request.

        Args:
            request: The incoming request

        Returns:
            The response from the next middleware or view

        Raises:
            Exception: Any unhandled exception from downstream middleware/views
        """
        start_time = time.perf_counter()

        # Extract request metadata
        request_id = getattr(request, "request_id", str(uuid.uuid4()))
        context = self._get_request_context(request)

        # Start span for tracing
        with tracer.start_as_current_span(
            f"{request.method} {request.path}", attributes=context
        ) as span:
            try:
                # Log request start with body in debug mode
                if settings.DEBUG:
                    context["request_body"] = self._get_request_body(request)
                self._logger.info("request_started", **context)

                # Process request
                response = self.get_response(request)

                # Calculate duration in milliseconds
                duration_ms = (time.perf_counter() - start_time) * 1000

                # Add response metadata
                context.update(
                    {
                        "status_code": response.status_code,
                        "duration_ms": round(duration_ms, 2),
                    }
                )

                # Log response body in debug mode
                if settings.DEBUG and hasattr(response, "content"):
                    try:
                        context["response_body"] = response.content.decode("utf-8")[
                            :1000
                        ]
                    except (UnicodeDecodeError, AttributeError):
                        context["response_body"] = "<binary>"

                # Update span
                span.set_attributes(context)

                # Log request completion
                self._logger.info("request_finished", **context)

                # Add timing header
                response["X-Request-Time-Ms"] = str(round(duration_ms, 2))

                return response

            except Exception as e:
                # Calculate duration for failed requests
                duration_ms = (time.perf_counter() - start_time) * 1000

                # Add error details to context
                context.update(
                    {
                        "error": str(e),
                        "error_type": type(e).__name__,
                        "duration_ms": round(duration_ms, 2),
                    }
                )

                # Update span with error
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                span.set_attributes(context)

                # Log error
                self._logger.exception("request_failed", **context)
                raise

    def _get_request_context(self, request: HttpRequest) -> Dict[str, Any]:
        """Get context information from the request.

        Args:
            request: The HTTP request

        Returns:
            Dictionary of request context information
        """
        return {
            "request_id": getattr(request, "request_id", str(uuid.uuid4())),
            "user_id": request.user.id if request.user.is_authenticated else None,
            "ip_address": self._get_client_ip(request),
            "method": request.method,
            "path": request.path,
            "query_params": dict(request.GET.items()),
            "content_type": request.content_type,
            "content_length": request.META.get("CONTENT_LENGTH"),
            "user_agent": request.META.get("HTTP_USER_AGENT"),
            "referer": request.META.get("HTTP_REFERER"),
        }

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
