import logging.config
from pathlib import Path
from typing import Any, Dict

import structlog


def configure_logging(
    log_level: str = "INFO", log_dir: Path = Path("logs"), app_name: str = "elfai"
) -> None:
    """
    Configure logging for the application with both file and console output.

    Args:
        log_level: Logging level (default: INFO)
        log_dir: Directory to store log files (default: logs)
        app_name: Application name for log files (default: elfai)
    """
    # Create log directory if it doesn't exist
    log_dir.mkdir(parents=True, exist_ok=True)

    # Common processors for structlog
    processors = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ]

    # Logging configuration
    config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": structlog.stdlib.ProcessorFormatter,
                "processor": structlog.processors.JSONRenderer(),
            },
            "colored": {
                "()": structlog.stdlib.ProcessorFormatter,
                "processor": structlog.dev.ConsoleRenderer(colors=True),
            },
        },
        "handlers": {
            "console": {
                "level": log_level,
                "class": "logging.StreamHandler",
                "formatter": "colored",
            },
            "json_file": {
                "level": log_level,
                "class": "logging.handlers.RotatingFileHandler",
                "filename": log_dir / f"{app_name}.json",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "formatter": "json",
            },
        },
        "loggers": {
            "": {
                "handlers": ["console", "json_file"],
                "level": log_level,
                "propagate": True,
            },
        },
    }

    # Configure standard logging
    logging.config.dictConfig(config)

    # Configure structlog
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Get a logger instance with the given name.

    Args:
        name: Logger name (typically __name__)

    Returns:
        A structured logger instance
    """
    return structlog.get_logger(name)


# Example usage in other modules:
# from apps.media.logging import get_logger
# logger = get_logger(__name__)
