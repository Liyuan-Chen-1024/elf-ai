"""Utilities for interacting with epguides API."""
from typing import Optional, Dict, Any
import requests

from apps.shows.typing import EpisodeDict, APIResponse
from apps.core.exceptions import EpguidesException
from apps.core.logging import get_logger

logger = get_logger(__name__)

API_BASE_URL = "https://epguides.frecar.no/show"
DEFAULT_TIMEOUT = 10


def make_api_request(endpoint: str, timeout: int = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    """Make a request to the epguides API.
    
    Args:
        endpoint: API endpoint to call
        timeout: Request timeout in seconds
        
    Returns:
        API response data
        
    Raises:
        EpguidesException: If the API request fails
    """
    url = f"{API_BASE_URL}/{endpoint}"
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Epguides API error for {url}: {str(e)}")
        raise EpguidesException(f"API request failed: {str(e)}")


def get_episode_info(
    show_name: str,
    season: Optional[int] = None,
    episode: Optional[int] = None,
    episode_type: Optional[str] = None
) -> Optional[EpisodeDict]:
    """Get episode information from epguides.
    
    Args:
        show_name: Name of the show on epguides
        season: Season number (optional)
        episode: Episode number (optional)
        episode_type: Type of episode to fetch ("first", "last", "next")
        
    Returns:
        Episode information if found, None otherwise
    """
    try:
        if episode_type:
            endpoint = f"{show_name}/{episode_type}"
        elif season is not None and episode is not None:
            endpoint = f"{show_name}/{season}/{episode}"
        else:
            raise ValueError("Must provide either episode_type or both season and episode")
            
        response: APIResponse = make_api_request(endpoint)
        return response.get("episode")
    except EpguidesException:
        return None
    except Exception as e:
        logger.error(f"Error fetching episode info for {show_name}: {str(e)}")
        return None


def get_show_status(show_name: str, episode: EpisodeDict) -> bool:
    """Check if an episode is released.
    
    Args:
        show_name: Name of the show on epguides
        episode: Episode information
        
    Returns:
        True if the episode is released, False otherwise
    """
    try:
        season, number = episode["season"], episode["number"]
        endpoint = f"{show_name}/{season}/{number}/released"
        response: APIResponse = make_api_request(endpoint)
        return bool(response.get("status", False))
    except Exception as e:
        logger.error(f"Error checking episode status for {show_name}: {str(e)}")
        return False 