"""Logging utilities for the application."""

import logging
from typing import Optional


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get a logger instance.

    Args:
        name: The name of the logger. If None, returns the root logger.

    Returns:
        A logger instance.
    """
    return logging.getLogger(name)
