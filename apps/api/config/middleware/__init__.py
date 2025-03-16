"""Project-wide middleware configuration.

This module exports middleware classes for:
- Request/Response logging
- Security headers
- Rate limiting
- Metrics collection
- Request tracing
- Error handling
- Performance monitoring
- API versioning
- Caching
"""

from .cache import SmartCacheMiddleware
from .errors import ErrorHandlerMiddleware
from .logging import RequestIDMiddleware, StructLogMiddleware
from .metrics import MetricsMiddleware
from .performance import PerformanceMiddleware
from .rate_limit import RateLimitMiddleware
from .security import SecurityHeadersMiddleware
from .versioning import APIVersionMiddleware

__all__ = [
    "RequestIDMiddleware",
    "SecurityHeadersMiddleware",
    "StructLogMiddleware",
    "RateLimitMiddleware",
    "MetricsMiddleware",
    "ErrorHandlerMiddleware",
    "PerformanceMiddleware",
    "APIVersionMiddleware",
    "SmartCacheMiddleware",
]
