"""Cache middleware for optimizing response times.

This module provides middleware for intelligent caching of responses
with support for:
- Content-based cache timeouts
- ETags for cache validation
- Cache control headers
- Vary header management
"""
from typing import Any, Callable, Dict, Optional, Set
from hashlib import md5

from django.conf import settings
from django.core.cache import cache
from django.http import HttpRequest, HttpResponse
from django.utils.cache import (
    get_cache_key,
    get_conditional_response,
    patch_cache_control,
    patch_vary_headers,
)
from structlog import get_logger

logger = get_logger(__name__)

# Cache timeout settings by content type (in seconds)
CACHE_TIMEOUTS: Dict[str, int] = {
    'text/html': 60,  # 1 minute for HTML
    'application/json': 300,  # 5 minutes for API responses
    'image/*': 86400,  # 24 hours for images
    'text/css': 604800,  # 1 week for CSS
    'application/javascript': 604800,  # 1 week for JS
    'font/*': 2592000,  # 30 days for fonts
    'default': 60,  # Default 1 minute
}

# Paths that should not be cached
CACHE_EXEMPT_PATHS: Set[str] = {
    '/admin/',
    '/api/auth/',
    '/health/',
}

class SmartCacheMiddleware:
    """Middleware for intelligent response caching.
    
    Features:
    - Content-type based cache timeouts
    - ETag generation and validation
    - Cache-Control header management
    - Vary header handling
    - Cache bypass for authenticated users
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Initialize the middleware.
        
        Args:
            get_response: The next middleware or view in the chain
        """
        self.get_response = get_response
        self._logger = logger

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process the request with caching.
        
        Args:
            request: The incoming request
            
        Returns:
            Cached response or new response
        """
        # Skip caching for exempt paths
        if self._is_path_exempt(request.path):
            return self.get_response(request)
            
        # Skip caching for authenticated users unless explicitly allowed
        if request.user.is_authenticated and not getattr(request, 'allow_cache', False):
            return self.get_response(request)
            
        # Try to get cached response
        cache_key = self._get_cache_key(request)
        response = cache.get(cache_key)
        
        if response is None:
            # Generate new response
            response = self.get_response(request)
            
            # Only cache successful responses
            if 200 <= response.status_code < 300:
                # Add cache headers
                self._add_cache_headers(request, response)
                
                # Cache the response
                timeout = self._get_cache_timeout(response)
                if timeout > 0:
                    cache.set(cache_key, response, timeout)
                    
        return response

    def _is_path_exempt(self, path: str) -> bool:
        """Check if path should be exempt from caching.
        
        Args:
            path: Request path
            
        Returns:
            True if path should not be cached
        """
        return any(path.startswith(exempt) for exempt in CACHE_EXEMPT_PATHS)

    def _get_cache_key(self, request: HttpRequest) -> str:
        """Generate a cache key for the request.
        
        Args:
            request: The HTTP request
            
        Returns:
            Cache key string
        """
        # Include query params in key
        key_parts = [
            request.path,
            request.method,
            request.GET.urlencode(),
        ]
        
        # Add language if i18n is enabled
        if hasattr(request, 'LANGUAGE_CODE'):
            key_parts.append(request.LANGUAGE_CODE)
            
        # Generate key
        key = ':'.join(key_parts)
        return f'view_cache:{md5(key.encode()).hexdigest()}'

    def _get_cache_timeout(self, response: HttpResponse) -> int:
        """Get cache timeout based on content type.
        
        Args:
            response: The HTTP response
            
        Returns:
            Cache timeout in seconds
        """
        content_type = response.get('Content-Type', '').split(';')[0]
        
        # Check for exact match
        if content_type in CACHE_TIMEOUTS:
            return CACHE_TIMEOUTS[content_type]
            
        # Check for wildcard match
        content_category = content_type.split('/')[0] + '/*'
        if content_category in CACHE_TIMEOUTS:
            return CACHE_TIMEOUTS[content_category]
            
        return CACHE_TIMEOUTS['default']

    def _add_cache_headers(self, request: HttpRequest, response: HttpResponse) -> None:
        """Add appropriate cache headers to response.
        
        Args:
            request: The HTTP request
            response: The HTTP response
        """
        # Add ETag
        if not response.has_header('ETag'):
            response['ETag'] = f'W/"{md5(response.content).hexdigest()}"'
            
        # Set Cache-Control
        timeout = self._get_cache_timeout(response)
        patch_cache_control(
            response,
            public=True,
            max_age=timeout,
            must_revalidate=True
        )
        
        # Set Vary header
        vary_headers = ['Accept', 'Accept-Encoding']
        if hasattr(request, 'LANGUAGE_CODE'):
            vary_headers.append('Accept-Language')
        patch_vary_headers(response, vary_headers) 