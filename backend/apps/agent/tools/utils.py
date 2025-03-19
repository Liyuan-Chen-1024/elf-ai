"""
Utility functions for agent tool implementation.

This module provides common helper functions used by multiple tools.
"""

import asyncio
from typing import Any, Dict, List, Optional, Tuple, Union

import aiohttp

from apps.core.logging import get_logger

logger = get_logger(__name__)


async def async_http_request(
    url: str,
    method: str = "GET",
    headers: Optional[Dict[str, str]] = None,
    params: Optional[Dict[str, Any]] = None,
    json_data: Optional[Dict[str, Any]] = None,
    timeout: int = 10,
) -> Tuple[int, Union[Dict[str, Any], str]]:
    """
    Make an asynchronous HTTP request.

    Args:
        url: The URL to request
        method: HTTP method (GET, POST, etc.)
        headers: Optional request headers
        params: Optional query parameters
        json_data: Optional JSON body data
        timeout: Request timeout in seconds

    Returns:
        Tuple of (status_code, response_data)
    """
    try:
        timeout_obj = aiohttp.ClientTimeout(total=timeout)
        async with aiohttp.ClientSession(timeout=timeout_obj) as session:
            if method == "GET":
                async with session.get(url, headers=headers, params=params) as response:
                    status = response.status
                    try:
                        data = await response.json()
                    except:
                        data = await response.text()
            elif method == "POST":
                async with session.post(
                    url, headers=headers, params=params, json=json_data
                ) as response:
                    status = response.status
                    try:
                        data = await response.json()
                    except:
                        data = await response.text()
            elif method == "PUT":
                async with session.put(
                    url, headers=headers, params=params, json=json_data
                ) as response:
                    status = response.status
                    try:
                        data = await response.json()
                    except:
                        data = await response.text()
            elif method == "DELETE":
                async with session.delete(
                    url, headers=headers, params=params
                ) as response:
                    status = response.status
                    try:
                        data = await response.json()
                    except:
                        data = await response.text()
            else:
                return 400, f"Unsupported HTTP method: {method}"

            return status, data
    except asyncio.TimeoutError:
        logger.error(f"Request timeout for {url}")
        return 408, "Request timeout"
    except Exception as e:
        logger.error(f"Error in async_http_request: {str(e)}")
        return 500, str(e)


def sanitize_params(params: Dict[str, Any], allowed_keys: List[str]) -> Dict[str, Any]:
    """
    Sanitize input parameters to only include allowed keys.

    Args:
        params: Dictionary of parameters
        allowed_keys: List of allowed parameter keys

    Returns:
        Sanitized parameters dictionary
    """
    return {k: v for k, v in params.items() if k in allowed_keys}


def format_exception(e: Exception) -> str:
    """
    Format an exception into a user-friendly error message.

    Args:
        e: The exception to format

    Returns:
        Formatted error message
    """
    error_type = type(e).__name__
    error_msg = str(e)

    if not error_msg:
        return f"An error occurred: {error_type}"

    return f"{error_type}: {error_msg}"


def safe_get(data: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    """
    Safely get a nested value from a dictionary.

    Args:
        data: Dictionary to extract value from
        keys: Sequence of keys to navigate nested dictionaries
        default: Default value to return if keys not found

    Returns:
        Extracted value or default
    """
    current = data
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return default
        current = current[key]
    return current
