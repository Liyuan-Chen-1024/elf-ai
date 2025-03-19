import logging
import re
from dataclasses import dataclass
from typing import Optional

import openai

logger = logging.getLogger(__name__)


@dataclass
class EpisodeInfo:
    """Information about a TV show episode."""

    show_name: str
    season: int
    episode: int


def extract_title_and_season_episode(filename: str) -> Optional[EpisodeInfo]:
    """Extract show name, season, and episode from a filename."""
    # Common patterns for TV show filenames
    patterns = [
        r"(.+?)[\. _][Ss](\d{1,2})[Ee](\d{1,2})",  # Show.S01E01
        r"(.+?)[\. _](\d{1,2})x(\d{1,2})",  # Show.1x01
        r"(.+?)[\. _][Ss]eason[\. _]?(\d{1,2})[\. _]?[Ee]pisode[\. _]?(\d{1,2})",  # Show.Season.1.Episode.01
    ]

    for pattern in patterns:
        match = re.search(pattern, filename, re.IGNORECASE)
        if match:
            show_name = match.group(1).replace(".", " ").strip()
            season = int(match.group(2))
            episode = int(match.group(3))
            return EpisodeInfo(show_name=show_name, season=season, episode=episode)

    # If no pattern matches, try AI extraction
    return extract_episode_info_with_ai(filename)


def extract_movie_title(filename: str) -> Optional[str]:
    """Extract movie title from a filename."""
    # Common patterns for movie filenames
    patterns = [
        r"(.+?)[\. _]\(\d{4}\)",  # Movie (2023)
        r"(.+?)[\. _]\d{4}",  # Movie 2023
        r"(.+?)[\. _]\d{4}p",  # Movie 1080p
    ]

    for pattern in patterns:
        match = re.search(pattern, filename, re.IGNORECASE)
        if match:
            return match.group(1).replace(".", " ").strip()

    # If no pattern matches, try AI extraction
    return extract_movie_title_with_ai(filename)


def extract_episode_info_with_ai(filename: str) -> Optional[EpisodeInfo]:
    """Extract episode information using AI."""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that extracts TV show information from filenames. "
                    "Please extract the show name, season number, and episode number from the filename. "
                    "Respond with only these three pieces of information in the format: show_name|season|episode",
                },
                {"role": "user", "content": filename},
            ],
            temperature=0.3,
            max_tokens=100,
        )

        if response.choices and response.choices[0].message.content:
            parts = response.choices[0].message.content.strip().split("|")
            if len(parts) == 3:
                try:
                    return EpisodeInfo(
                        show_name=parts[0].strip(),
                        season=int(parts[1]),
                        episode=int(parts[2]),
                    )
                except ValueError:
                    pass

    except Exception as e:
        logger.error(f"Error extracting episode info with AI: {str(e)}")

    return None


def extract_movie_title_with_ai(filename: str) -> Optional[str]:
    """Extract movie title using AI."""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that extracts movie titles from filenames. "
                    "Please extract just the movie title from the filename, removing any year, quality, "
                    "or other metadata. Respond with only the movie title.",
                },
                {"role": "user", "content": filename},
            ],
            temperature=0.3,
            max_tokens=100,
        )

        if response.choices and response.choices[0].message.content:
            return response.choices[0].message.content.strip()

    except Exception as e:
        logger.error(f"Error extracting movie title with AI: {str(e)}")

    return None
