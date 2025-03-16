"""Rate limiting middleware."""
from typing import Callable, Dict, Optional, Set, cast

from django.conf import settings
from django.core.cache import cache
from django.http import HttpRequest, HttpResponse
from django.utils import timezone
from structlog import get_logger

logger = get_logger(__name__)

# Paths that should not be rate limited
EXEMPT_PATHS: Set[str] = {
    '/admin/',
    '/static/',
    '/media/',
    '/health/',
}

class RateLimitMiddleware:
    """Rate limiting middleware using Redis cache.
    
    This middleware implements a sliding window rate limit using Redis.
    It can be configured via Django settings:
    
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 60  # requests per window
    RATE_LIMIT_WINDOW: int = 60  # window size in seconds
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Initialize the middleware.
        
        Args:
            get_response: The next middleware or view in the chain
        """
        self.get_response = get_response
        self.enabled: bool = getattr(settings, 'RATE_LIMIT_ENABLED', True)
        self.max_requests: int = getattr(settings, 'RATE_LIMIT_REQUESTS', 60)
        self.window: int = getattr(settings, 'RATE_LIMIT_WINDOW', 60)

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process the request.
        
        Args:
            request: The incoming request
            
        Returns:
            The response from the next middleware or view, or 429 if rate limited
        """
        if not self.enabled or not self._should_rate_limit(request):
            return self.get_response(request)

        client_ip = self._get_client_ip(request)
        key = f"rate_limit:{client_ip}"
        
        # Get current window data
        window_data = self._get_window_data(key)
        
        if window_data['count'] >= self.max_requests:
            logger.warning('rate_limit_exceeded', 
                ip_address=client_ip,
                path=request.path,
                count=window_data['count']
            )
            return HttpResponse(
                'Rate limit exceeded. Please try again later.',
                content_type='text/plain',
                status=429
            )
        
        # Update window data
        window_data['count'] += 1
        cache.set(key, window_data, self.window)
        
        # Add rate limit headers
        response = cast(HttpResponse, self.get_response(request))
        response['X-RateLimit-Limit'] = str(self.max_requests)
        response['X-RateLimit-Remaining'] = str(self.max_requests - window_data['count'])
        response['X-RateLimit-Reset'] = str(window_data['reset'])
        
        return response

    def _should_rate_limit(self, request: HttpRequest) -> bool:
        """Check if the request should be rate limited.
        
        Args:
            request: The HTTP request
            
        Returns:
            True if the request should be rate limited
        """
        # Don't rate limit staff/admin users if authenticated
        if hasattr(request, 'user') and request.user.is_authenticated and request.user.is_staff:
            return False
            
        # Don't rate limit exempt paths
        path = request.path.lstrip('/')
        return not any(path.startswith(prefix.lstrip('/')) for prefix in EXEMPT_PATHS)

    def _get_client_ip(self, request: HttpRequest) -> str:
        """Get the client IP address from the request.
        
        Args:
            request: The HTTP request
            
        Returns:
            The client IP address
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '')

    def _get_window_data(self, key: str) -> Dict[str, int]:
        """Get the current window data from cache.
        
        Args:
            key: The cache key
            
        Returns:
            Dictionary with count and reset timestamp
        """
        now = int(timezone.now().timestamp())
        window_data = cache.get(key)
        
        if window_data is None:
            window_data = {
                'count': 0,
                'reset': now + self.window
            }
            
        return window_data 