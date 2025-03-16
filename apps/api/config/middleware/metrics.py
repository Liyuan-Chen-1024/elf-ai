"""Metrics middleware for collecting and exposing Prometheus metrics."""
import time
from typing import Any, Callable, Dict, Optional

from django.http import HttpRequest, HttpResponse
from prometheus_client import Counter, Histogram
from structlog import get_logger

logger = get_logger(__name__)

# Define metrics
REQUEST_LATENCY = Histogram(
    'http_request_latency_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint', 'status']
)

REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP request count',
    ['method', 'endpoint', 'status']
)

ERROR_COUNT = Counter(
    'http_request_errors_total',
    'Total HTTP request errors',
    ['method', 'endpoint', 'status', 'error_type']
)

class MetricsMiddleware:
    """Middleware for collecting request metrics.
    
    This middleware collects:
    - Request latency
    - Request count by method/endpoint/status
    - Error count by type
    - Custom business metrics
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Initialize the middleware.
        
        Args:
            get_response: The next middleware or view in the chain
        """
        self.get_response = get_response
        self._logger = logger

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process the request and collect metrics.
        
        Args:
            request: The incoming request
            
        Returns:
            The response from the next middleware or view
        """
        start_time = time.perf_counter()
        
        try:
            response = self.get_response(request)
            
            # Calculate request duration
            duration = time.perf_counter() - start_time
            
            # Extract endpoint from request
            endpoint = self._get_endpoint_name(request)
            
            # Record metrics
            labels = {
                'method': request.method,
                'endpoint': endpoint,
                'status': response.status_code
            }
            
            REQUEST_LATENCY.labels(**labels).observe(duration)
            REQUEST_COUNT.labels(**labels).inc()
            
            return response
            
        except Exception as e:
            # Record error metrics
            error_labels = {
                'method': request.method,
                'endpoint': self._get_endpoint_name(request),
                'status': 500,
                'error_type': type(e).__name__
            }
            ERROR_COUNT.labels(**error_labels).inc()
            
            # Re-raise the exception
            raise

    def _get_endpoint_name(self, request: HttpRequest) -> str:
        """Get a normalized endpoint name from the request.
        
        This helps prevent high cardinality in metrics by normalizing
        URLs with path parameters.
        
        Args:
            request: The HTTP request
            
        Returns:
            Normalized endpoint name
        """
        # Get resolved URL pattern if available
        if hasattr(request, 'resolver_match') and request.resolver_match:
            return request.resolver_match.url_name or request.resolver_match.view_name
            
        # Fall back to path
        path = request.path.strip('/')
        if not path:
            return 'root'
            
        # Normalize path by replacing numeric IDs with {id}
        parts = []
        for part in path.split('/'):
            if part.isdigit():
                parts.append('{id}')
            else:
                parts.append(part)
                
        return '/'.join(parts) 