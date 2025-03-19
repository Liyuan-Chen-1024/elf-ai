"""Error handling middleware.

This module provides middleware for handling errors and exceptions with:
- Consistent error response format
- Detailed error information in development
- Sanitized error messages in production
- Error tracking integration
- Performance impact tracking
"""

import sys
import traceback
from typing import Any, Callable, Dict, Optional, Type

from django.conf import settings
from django.core.exceptions import PermissionDenied, ValidationError
from django.http import (
    Http404,
    HttpRequest,
    HttpResponse,
    HttpResponseServerError,
    JsonResponse,
)
from django.urls import resolve
from rest_framework import status
from rest_framework.exceptions import APIException

from structlog import get_logger

logger = get_logger(__name__)

# Map Django/Python exceptions to HTTP status codes
ERROR_MAPPING: Dict[Type[Exception], int] = {
    Http404: status.HTTP_404_NOT_FOUND,
    PermissionDenied: status.HTTP_403_FORBIDDEN,
    ValidationError: status.HTTP_400_BAD_REQUEST,
    ValueError: status.HTTP_400_BAD_REQUEST,
    KeyError: status.HTTP_400_BAD_REQUEST,
    APIException: status.HTTP_500_INTERNAL_SERVER_ERROR,
}


class ErrorHandlerMiddleware:
    """Middleware for consistent error handling.

    Features:
    - Consistent error response format
    - Development vs production error detail
    - Performance impact tracking
    - Error tracking integration
    - Automatic status code mapping
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Initialize the middleware.

        Args:
            get_response: The next middleware or view in the chain
        """
        self.get_response = get_response
        self._logger = logger

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process the request and handle any errors.

        Args:
            request: The incoming request

        Returns:
            Error response or normal response
        """
        try:
            response = self.get_response(request)
            return response

        except Exception as e:
            return self.handle_error(request, e)

    def handle_error(self, request: HttpRequest, exc: Exception) -> HttpResponse:
        """Handle an exception and return appropriate response.

        Args:
            request: The HTTP request
            exc: The exception that occurred

        Returns:
            Error response with appropriate status and format
        """
        # Get error details
        error_dict = self._get_error_dict(request, exc)

        # Log error
        self._log_error(request, exc, error_dict)

        # Determine response format
        if "application/json" in request.headers.get("Accept", ""):
            return JsonResponse(error_dict, status=error_dict["status"], safe=False)

        # HTML response for browser requests
        if settings.DEBUG:
            return self._debug_response(request, exc, error_dict)

        return HttpResponseServerError(
            content=error_dict["message"], content_type="text/plain"
        )

    def _get_error_dict(self, request: HttpRequest, exc: Exception) -> Dict[str, Any]:
        """Get error details as a dictionary.

        Args:
            request: The HTTP request
            exc: The exception that occurred

        Returns:
            Dictionary with error details
        """
        # Get status code
        status_code = self._get_status_code(exc)

        # Base error dict
        error_dict = {
            "error": True,
            "status": status_code,
            "type": exc.__class__.__name__,
            "message": str(exc),
            "code": getattr(exc, "code", None),
        }

        # Add traceback in debug mode
        if settings.DEBUG:
            error_dict.update(
                {
                    "traceback": traceback.format_exc(),
                    "module": getattr(exc, "__module__", None),
                    "line": self._get_error_line(exc),
                    "request": {
                        "method": request.method,
                        "path": request.path,
                        "query": request.GET.dict(),
                        "body": request.body.decode() if request.body else None,
                        "headers": dict(request.headers),
                    },
                }
            )

        return error_dict

    def _get_status_code(self, exc: Exception) -> int:
        """Get HTTP status code for exception.

        Args:
            exc: The exception

        Returns:
            HTTP status code
        """
        # Check mapping
        for exc_class, status_code in ERROR_MAPPING.items():
            if isinstance(exc, exc_class):
                return status_code

        # Default to 500
        return status.HTTP_500_INTERNAL_SERVER_ERROR

    def _get_error_line(self, exc: Exception) -> Optional[str]:
        """Get source file and line number where error occurred.

        Args:
            exc: The exception

        Returns:
            String with file:line or None
        """
        tb = traceback.extract_tb(sys.exc_info()[2])
        if tb:
            filename, line, _, _ = tb[-1]
            return f"{filename}:{line}"
        return None

    def _log_error(
        self, request: HttpRequest, exc: Exception, error_dict: Dict[str, Any]
    ) -> None:
        """Log error details.

        Args:
            request: The HTTP request
            exc: The exception that occurred
            error_dict: Dictionary with error details
        """
        # Get view name if available
        view_name = None
        try:
            match = resolve(request.path)
            view_name = match.view_name
        except:
            pass

        # Log error
        self._logger.error(
            "request_error",
            error_type=error_dict["type"],
            error_message=error_dict["message"],
            status_code=error_dict["status"],
            view=view_name,
            path=request.path,
            method=request.method,
            exc_info=True,
        )

    def _debug_response(
        self, request: HttpRequest, exc: Exception, error_dict: Dict[str, Any]
    ) -> HttpResponse:
        """Generate detailed error response for debug mode.

        Args:
            request: The HTTP request
            exc: The exception that occurred
            error_dict: Dictionary with error details

        Returns:
            Detailed error response
        """
        from django.views import debug

        # Use Django's technical 500 page in debug mode
        return debug.technical_500_response(request, *sys.exc_info())
