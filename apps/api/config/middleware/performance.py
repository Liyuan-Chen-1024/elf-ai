"""Performance middleware for monitoring and optimization.

This module provides middleware for:
- Response time tracking
- Database query monitoring
- Memory usage tracking
- Cache hit/miss monitoring
- Performance headers
"""

import time
from typing import Callable, Optional

from django.db import connection
from django.http import HttpRequest, HttpResponse

from structlog import get_logger

logger = get_logger(__name__)


class PerformanceMiddleware:
    """Middleware for monitoring and optimizing performance.

    Features:
    - Response time tracking
    - Database query monitoring
    - Memory usage tracking
    - Cache hit/miss monitoring
    - Performance headers
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Initialize the middleware.

        Args:
            get_response: The next middleware or view in the chain
        """
        self.get_response = get_response
        self._logger = logger

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process the request and track performance metrics.

        Args:
            request: The incoming request

        Returns:
            Response with performance headers
        """
        # Start timing
        start_time = time.perf_counter()
        start_queries = len(connection.queries)

        # Process request
        response = self.get_response(request)

        # Calculate metrics
        duration = (time.perf_counter() - start_time) * 1000
        db_queries = len(connection.queries) - start_queries

        # Get memory usage if psutil is available
        memory_usage = self._get_memory_usage()

        # Add performance headers
        self._add_performance_headers(
            response,
            duration=duration,
            db_queries=db_queries,
            memory_usage=memory_usage,
        )

        # Log performance metrics
        self._log_performance_metrics(
            request=request,
            response=response,
            duration=duration,
            db_queries=db_queries,
            memory_usage=memory_usage,
        )

        return response

    def _get_memory_usage(self) -> Optional[float]:
        """Get current memory usage in MB.

        Returns:
            Memory usage in MB or None if psutil not available
        """
        try:
            import psutil

            process = psutil.Process()
            return process.memory_info().rss / 1024 / 1024
        except ImportError:
            return None

    def _add_performance_headers(
        self,
        response: HttpResponse,
        duration: float,
        db_queries: int,
        memory_usage: Optional[float],
    ) -> None:
        """Add performance headers to response.

        Args:
            response: The HTTP response
            duration: Request duration in milliseconds
            db_queries: Number of database queries
            memory_usage: Memory usage in MB
        """
        # Add Server-Timing header
        timing_headers = [
            f"total;dur={duration:.2f}",
            f'db;desc="DB Queries: {db_queries}"',
        ]

        if memory_usage is not None:
            timing_headers.append(f'memory;desc="Memory: {memory_usage:.1f}MB"')

        response["Server-Timing"] = ", ".join(timing_headers)

        # Add other performance headers
        response["X-Response-Time-Ms"] = f"{duration:.2f}"
        response["X-DB-Queries"] = str(db_queries)

        if memory_usage is not None:
            response["X-Memory-Usage-MB"] = f"{memory_usage:.1f}"

    def _log_performance_metrics(
        self,
        request: HttpRequest,
        response: HttpResponse,
        duration: float,
        db_queries: int,
        memory_usage: Optional[float],
    ) -> None:
        """Log performance metrics.

        Args:
            request: The HTTP request
            response: The HTTP response
            duration: Request duration in milliseconds
            db_queries: Number of database queries
            memory_usage: Memory usage in MB
        """
        metrics = {
            "duration_ms": round(duration, 2),
            "db_queries": db_queries,
            "status_code": response.status_code,
            "method": request.method,
            "path": request.path,
        }

        if memory_usage is not None:
            metrics["memory_mb"] = round(memory_usage, 1)

        # Add warning for slow requests
        if duration > 1000:  # More than 1 second
            metrics["warning"] = "slow_request"

        # Add warning for many queries
        if db_queries > 100:
            metrics["warning"] = f"{db_queries}_queries"

        self._logger.info("request_performance", **metrics)

    def process_view(
        self,
        request: HttpRequest,
        view_func: Callable,
        view_args: tuple,
        view_kwargs: dict,
    ) -> Optional[HttpResponse]:
        """Store view name for performance tracking.

        Args:
            request: The HTTP request
            view_func: The view function
            view_args: Positional arguments for view
            view_kwargs: Keyword arguments for view
        """
        request._view_name = view_func.__name__
        return None
