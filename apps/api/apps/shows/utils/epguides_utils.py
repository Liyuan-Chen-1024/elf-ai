"""Utilities for epguides API."""

import json
import logging
import re
import time
from datetime import date, datetime
from typing import List, Optional, Tuple, Union, cast
from urllib.parse import urljoin

from django.conf import settings
from django.db import transaction

import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

from apps.core.exceptions import EpguidesException
from apps.shows.models import TVShow

from ..types import DateStr, EpisodeDict, JsonDict

logger = logging.getLogger(__name__)


def create_session_with_retries() -> requests.Session:
    """Create a requests session with retry strategy.

    Returns:
        Session configured with retry strategy
    """
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def process_epguide_key(
    session: requests.Session,
    key: bytes,
    delay: int = 5,
) -> Tuple[bool, Optional[str]]:
    """Process a single epguide key and return success status and error message.

    Args:
        session: Requests session to use
        key: Epguide key to process
        delay: Delay between API requests in seconds

    Returns:
        Tuple of (success, error_message)
    """
    try:
        key_str = key.decode("utf-8").lower()
        url = urljoin(settings.EPGUIDES_API_URL, f"show/{key_str}")

        response = session.get(url)
        response.raise_for_status()

        # Create or update TVShow entry
        show_data = response.json()
        if show_data and "name" in show_data:
            TVShow.objects.get_or_create(
                epguide_name=key_str,
                defaults={
                    "full_name": show_data["name"],
                    "active": False,  # New shows are inactive by default
                },
            )
            logger.info(f"Successfully processed show: {key_str}")
            time.sleep(delay)  # Rate limiting
            return True, None

        return False, f"Invalid show data format for {key_str}"

    except requests.exceptions.RequestException as e:
        return False, f"Request failed for {key_str}: {str(e)}"
    except Exception as e:
        return False, f"Error processing {key_str}: {str(e)}"


def find_and_process_new_epguide_keys(delay: int = 5) -> Tuple[int, int, List[str]]:
    """Find and process new epguide keys.

    Args:
        delay: Delay between API requests in seconds

    Returns:
        Tuple containing:
        - total_processed: Total number of shows processed
        - successful_count: Number of shows successfully processed
        - errors: List of error messages
    """
    session = create_session_with_retries()
    errors: List[str] = []
    successful_count = 0
    total_processed = 0

    try:
        # Fetch the current shows list
        response = session.get(urljoin(settings.EPGUIDES_API_URL, "shows"))
        response.raise_for_status()

        # Extract show keys using regex
        epguide_keys = re.findall(b'href="..\/([\w+]*)\/"\>', response.content)
        total_keys = len(epguide_keys)
        logger.info(f"Found {total_keys} epguide keys")

        # Process each key
        with transaction.atomic():
            for key in epguide_keys:
                total_processed += 1
                success, error = process_epguide_key(session, key, delay)

                if success:
                    successful_count += 1
                elif error:
                    errors.append(error)
                    logger.error(error)

    except requests.exceptions.RequestException as e:
        error_msg = f"Failed to fetch show list: {str(e)}"
        errors.append(error_msg)
        logger.error(error_msg)
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        errors.append(error_msg)
        logger.error(error_msg)

    return total_processed, successful_count, errors


def epguides_api_request(endpoint: str) -> Optional[JsonDict]:
    """Make a request to the epguides API.

    Args:
        endpoint: API endpoint to request

    Returns:
        JSON response if successful, None otherwise

    Raises:
        EpguidesException: If request fails or response is invalid
    """
    try:
        url = urljoin(settings.EPGUIDES_API_URL, endpoint)
        response = requests.get(url)
        response.raise_for_status()
        return cast(JsonDict, response.json())
    except requests.exceptions.RequestException as e:
        logger.error(f"Error making request to epguides API: {str(e)}")
        raise EpguidesException(f"Error making request to epguides API: {str(e)}")
    except json.JSONDecodeError as e:
        logger.error(f"Error decoding JSON response from epguides API: {str(e)}")
        raise EpguidesException(
            f"Error decoding JSON response from epguides API: {str(e)}"
        )


def get_episode_info(
    show_name: str,
    season: Union[int, str],
    episode: Optional[int] = None,
) -> Optional[EpisodeDict]:
    """Get information about a specific episode.

    Args:
        show_name: Name of the show
        season: Season number or special value ("first", "last", "next")
        episode: Episode number (not needed for special season values)

    Returns:
        Episode information if found, None otherwise
    """
    try:
        endpoint = f"show/{show_name}"
        if isinstance(season, int) and episode is not None:
            endpoint += f"/episode/{season}/{episode}/"
        else:
            endpoint += f"/{season}/"

        response = epguides_api_request(endpoint)
        return cast(
            Optional[EpisodeDict], response.get("episode") if response else None
        )
    except EpguidesException:
        return None


def get_show_status(show_name: str, episode: Optional[EpisodeDict] = None) -> bool:
    """Get the status of a show.

    Args:
        show_name: Name of the show
        episode: Optional episode info to check status for

    Returns:
        True if show/episode is available, False otherwise
    """
    try:
        endpoint = f"show/{show_name}/status/"
        if episode:
            endpoint = f"show/{show_name}/episode/{episode['season']}/{episode['episode']}/status/"

        response = epguides_api_request(endpoint)
        return bool(response.get("status")) if response else False
    except EpguidesException:
        return False


def get_show_info(show_name: str) -> Optional[JsonDict]:
    """Get information about a show.

    Args:
        show_name: Name of the show

    Returns:
        Show information if found, None otherwise
    """
    try:
        response = epguides_api_request(f"show/{show_name}/info/")
        return cast(Optional[JsonDict], response.get("show") if response else None)
    except EpguidesException:
        return None


def get_next_episode(
    show_name: str,
    season: int,
    episode: int,
) -> Optional[EpisodeDict]:
    """Get information about the next episode.

    Args:
        show_name: Name of the show
        season: Current season number
        episode: Current episode number

    Returns:
        Next episode information if found, None otherwise
    """
    try:
        response = epguides_api_request(f"show/{show_name}/next/{season}/{episode}/")
        return cast(
            Optional[EpisodeDict], response.get("episode") if response else None
        )
    except EpguidesException:
        return None


def get_last_episode(show_name: str) -> Optional[EpisodeDict]:
    """Get information about the last episode.

    Args:
        show_name: Name of the show

    Returns:
        Last episode information if found, None otherwise
    """
    try:
        response = epguides_api_request(f"show/{show_name}/last/")
        return cast(
            Optional[EpisodeDict], response.get("episode") if response else None
        )
    except EpguidesException:
        return None


def get_magnets(
    show_name: str,
    season: int,
    episode: int,
) -> List[JsonDict]:
    """Get magnet links for a specific episode.

    Args:
        show_name: Name of the show
        season: Season number
        episode: Episode number

    Returns:
        List of magnet information dictionaries
    """
    try:
        response = epguides_api_request(f"show/{show_name}/magnet/{season}/{episode}/")
        return cast(List[JsonDict], response.get("magnets", []) if response else [])
    except EpguidesException:
        return []


def parse_release_date(date_str: Optional[DateStr]) -> Optional[date]:
    """Parse a release date string into a date object.

    Args:
        date_str: Date string in YYYY-MM-DD format

    Returns:
        Date object if parsing successful, None otherwise
    """
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None
