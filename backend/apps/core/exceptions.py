from typing import Any, Dict, List, Optional, Union


class ShowNotFoundException(Exception):
    """Raised when a show is not found."""

    pass


class SeasonNotFoundException(Exception):
    """Raised when a season is not found."""

    pass


class EpisodeNotFoundException(Exception):
    """Raised when an episode is not found."""

    pass


class EpguidesException(Exception):
    """Base exception for epguides-related errors."""

    pass
