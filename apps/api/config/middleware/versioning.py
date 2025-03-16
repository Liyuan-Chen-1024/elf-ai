"""API versioning middleware.

This module provides middleware for handling API versioning through:
- URL versioning (/api/v1/)
- Header versioning (X-API-Version)
- Accept header versioning (Accept: application/vnd.elfai.v1+json)
- Version deprecation warnings
"""
from datetime import datetime
from typing import Any, Callable, Dict, Optional, Set, Tuple

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.urls import resolve
from structlog import get_logger

logger = get_logger(__name__)

# API version configuration
API_VERSIONS = {
    'v1': {
        'sunset_date': None,  # No sunset date yet
        'deprecated': False,
    },
    'v2': {
        'sunset_date': None,
        'deprecated': False,
    }
}

# Default version if none specified
DEFAULT_VERSION = 'v1'

class APIVersionMiddleware:
    """Middleware for API versioning and deprecation handling.
    
    Features:
    - Multiple versioning schemes
    - Version negotiation
    - Deprecation warnings
    - Sunset notices
    - Version headers
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Initialize the middleware.
        
        Args:
            get_response: The next middleware or view in the chain
        """
        self.get_response = get_response
        self._logger = logger

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process the request and handle API versioning.
        
        Args:
            request: The incoming request
            
        Returns:
            The response with appropriate version headers
        """
        # Only process API requests
        if not request.path.startswith('/api/'):
            return self.get_response(request)
            
        # Determine API version
        version, source = self._get_version(request)
        
        # Store version info on request
        request.api_version = version
        request.api_version_source = source
        
        # Get version config
        version_config = API_VERSIONS.get(version, {})
        
        # Process request
        response = self.get_response(request)
        
        # Add version headers
        response['X-API-Version'] = version
        response['X-API-Version-Source'] = source
        
        # Add deprecation warning if needed
        if version_config.get('deprecated'):
            response['Warning'] = (
                '299 - "This API version is deprecated. '
                'Please migrate to a newer version."'
            )
            
        # Add sunset header if configured
        sunset_date = version_config.get('sunset_date')
        if sunset_date:
            response['Sunset'] = sunset_date.strftime('%a, %d %b %Y %H:%M:%S GMT')
            
        return response

    def _get_version(self, request: HttpRequest) -> Tuple[str, str]:
        """Determine API version from request.
        
        Checks in order:
        1. URL version (/api/v1/)
        2. X-API-Version header
        3. Accept header version
        4. Default version
        
        Args:
            request: The HTTP request
            
        Returns:
            Tuple of (version, source)
        """
        # Check URL version
        match = resolve(request.path)
        if hasattr(match, 'kwargs') and 'version' in match.kwargs:
            return match.kwargs['version'], 'url'
            
        # Check version header
        version_header = request.headers.get('X-API-Version')
        if version_header and version_header in API_VERSIONS:
            return version_header, 'header'
            
        # Check Accept header
        accept = request.headers.get('Accept', '')
        if 'application/vnd.elfai.' in accept:
            for version in API_VERSIONS:
                if f'vnd.elfai.{version}+json' in accept:
                    return version, 'accept'
                    
        # Use default version
        return DEFAULT_VERSION, 'default'

    def process_view(self, request: HttpRequest, view_func: Callable, 
                    view_args: tuple, view_kwargs: dict) -> Optional[HttpResponse]:
        """Process view to handle version-specific logic.
        
        Args:
            request: The HTTP request
            view_func: The view function
            view_args: Positional arguments for the view
            view_kwargs: Keyword arguments for the view
            
        Returns:
            None to continue processing, or HttpResponse to short-circuit
        """
        if not hasattr(request, 'api_version'):
            return None
            
        # Add version to view kwargs
        view_kwargs['api_version'] = request.api_version
        
        # Log version usage
        self._logger.info(
            'api_version_used',
            version=request.api_version,
            source=request.api_version_source,
            path=request.path,
            method=request.method
        )
        
        return None 

    def _get_accept_version(self, request: HttpRequest) -> str:
        """
        Get API version from Accept header.
        
        Example:
            Accept: application/vnd.elfai.v1+json
        
        Returns:
            String with the version or None if not found/invalid
        """
        accept = request.META.get('HTTP_ACCEPT', '')
        
        # Check if the Accept header contains our vendor-specific type
        if 'application/vnd.elfai.' in accept:
            # Extract the version from the Accept header
            if f'vnd.elfai.{version}+json' in accept:
                return version 