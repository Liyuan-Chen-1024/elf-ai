"""Logging configuration and utilities for the application."""

import structlog
from typing import Any, Dict, Optional, Union
from django.http import HttpRequest, HttpResponse

def get_logger(name: Optional[str] = None) -> structlog.BoundLogger:
    """Get a structured logger instance.
    
    Args:
        name: Optional name for the logger. If None, uses the module name.
        
    Returns:
        A configured structlog logger instance.
    """
    logger = structlog.get_logger(name)
    return logger

def bind_extra(
    logger: structlog.BoundLogger,
    **kwargs: Any
) -> structlog.BoundLogger:
    """Bind additional context to a logger instance.
    
    Args:
        logger: The logger instance to bind context to.
        **kwargs: Additional key-value pairs to bind.
        
    Returns:
        Logger with bound context.
    """
    return logger.bind(**kwargs)

def get_request_logger(request: HttpRequest) -> structlog.BoundLogger:
    """Get a logger pre-configured with request context.
    
    Args:
        request: The Django request object.
        
    Returns:
        Logger with request context bound.
    """
    logger = get_logger(__name__)
    
    # Extract useful request information
    extra: Dict[str, Any] = {
        "request_id": getattr(request, "request_id", None),
        "user_id": request.user.id if hasattr(request, "user") and request.user.is_authenticated else None,
        "ip": request.META.get("REMOTE_ADDR"),
        "path": request.path,
        "method": request.method,
        "query_params": dict(request.GET.items()) if request.GET else None,
    }
    
    return bind_extra(logger, **extra)

def log_request_started(logger: structlog.BoundLogger, request: HttpRequest) -> None:
    """Log the start of an HTTP request.
    
    Args:
        logger: The logger instance to use.
        request: The Django request object.
    """
    logger.info(
        "http_request_started",
        method=request.method,
        path=request.path,
        content_type=request.content_type,
        content_length=request.META.get("CONTENT_LENGTH"),
    )

def log_request_finished(
    logger: structlog.BoundLogger,
    request: HttpRequest,
    response: HttpResponse,
    duration_ms: float,
) -> None:
    """Log the completion of an HTTP request.
    
    Args:
        logger: The logger instance to use.
        request: The Django request object.
        response: The Django response object.
        duration_ms: Request duration in milliseconds.
    """
    # For 4xx and 5xx responses, log at warning/error level
    if response.status_code >= 500:
        log_method = logger.error
    elif response.status_code >= 400:
        log_method = logger.warning
    else:
        log_method = logger.info

    log_method(
        "http_request_finished",
        method=request.method,
        path=request.path,
        status_code=response.status_code,
        duration_ms=round(duration_ms, 2),
        content_type=response.get("Content-Type"),
        content_length=response.get("Content-Length"),
    )

def log_model_change(
    logger: structlog.BoundLogger,
    model_name: str,
    instance_id: Optional[Union[int, str]],
    action: str,
    **extra: Any
) -> None:
    """Log model changes consistently.
    
    Args:
        logger: The logger instance to use.
        model_name: Name of the model being changed.
        instance_id: ID of the instance being changed.
        action: Action being performed (create/update/delete).
        **extra: Additional context to log.
    """
    event = f"{model_name}_{action}"
    logger.info(
        event,
        model=model_name,
        instance_id=instance_id,
        action=action,
        **extra
    )

# Common log decorators
def log_function_call(logger: structlog.BoundLogger):
    """Decorator to log function calls with timing."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            import time
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                logger.info(
                    f"{func.__name__}_completed",
                    function=func.__name__,
                    duration_ms=round(duration_ms, 2),
                )
                return result
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                logger.exception(
                    f"{func.__name__}_failed",
                    function=func.__name__,
                    duration_ms=round(duration_ms, 2),
                    error=str(e),
                    error_type=type(e).__name__,
                )
                raise
        return wrapper
    return decorator
