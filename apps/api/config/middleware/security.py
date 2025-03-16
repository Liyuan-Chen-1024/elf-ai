"""Security middleware for Django application.

This module provides security middleware that adds various security headers
and implements security best practices.
"""
from typing import Any, Callable, Dict, Optional

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.utils.deprecation import MiddlewareMixin


class SecurityHeadersMiddleware:
    """Add security headers to all responses.
    
    This middleware adds various security headers to protect against:
    - XSS attacks
    - Clickjacking
    - MIME type sniffing
    - SSL/TLS downgrade attacks
    - Referrer leakage
    - Content injection
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        """Initialize the middleware.
        
        Args:
            get_response: The next middleware or view in the chain
        """
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process the request and add security headers to response.
        
        Args:
            request: The incoming request
            
        Returns:
            The response with added security headers
        """
        response = self.get_response(request)
        
        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # Adjust based on needs
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self'",
            "media-src 'self'",
            "object-src 'none'",
            "frame-src 'self'",
            "worker-src 'self'",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "base-uri 'self'",
            "manifest-src 'self'",
        ]
        
        # Add security headers
        security_headers: Dict[str, str] = {
            'Content-Security-Policy': '; '.join(csp_directives),
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Resource-Policy': 'same-origin',
        }
        
        # Add HSTS header in production
        if not settings.DEBUG:
            security_headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        # Add headers to response
        for header, value in security_headers.items():
            response[header] = value
            
        return response 