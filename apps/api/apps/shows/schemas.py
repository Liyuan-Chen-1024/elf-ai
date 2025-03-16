from datetime import date
from enum import Enum
from typing import Optional, Tuple

from pydantic import BaseModel, Field, validator


class ShowStatus(str, Enum):
    """Enum for possible show statuses."""

    FINISHED = "Finished"
    UP_TO_DATE = "Up to date"
    BEHIND = "Behind"


class StatusColor(str, Enum):
    """Enum for status colors."""

    GRAY = "gray"
    GREEN = "green"
    RED = "red"


class EpisodeData(BaseModel):
    """Validation model for episode data from epguides API."""

    season: int = Field(..., ge=1)
    number: int = Field(..., ge=1)
    release_date: date
    title: Optional[str] = None


class ShowData(BaseModel):
    """Validation model for show data."""

    epguide_name: str = Field(..., min_length=1, max_length=250)
    full_name: str = Field(..., min_length=1, max_length=250)
    current_season: int = Field(default=1, ge=1)
    current_episode: int = Field(default=1, ge=1)
    active: bool = False
    keep: bool = False
    downloaded_current_episode: bool = False
    episode_lookup_type: str = Field(default="number", pattern="^(number|date)$")
    first_release_date: Optional[date] = None
    last_release_date: Optional[date] = None
    last_release_season: Optional[int] = Field(None, ge=1)
    last_release_episode: Optional[int] = Field(None, ge=1)
    next_release_date: Optional[date] = None

    @validator("epguide_name")
    def validate_epguide_name(cls, v: str) -> str:
        """Validate epguide_name format."""
        if not v.replace("_", "").isalnum():
            raise ValueError(
                "epguide_name must contain only letters, numbers, and underscores"
            )
        return v

    def get_status(self) -> Tuple[ShowStatus, StatusColor]:
        """
        Get the current status of the show.

        Returns:
            Tuple of (status, color)
        """
        today = date.today()

        if (
            self.next_release_date == self.last_release_date
            and self.next_release_date
            and self.next_release_date < today
        ):
            return ShowStatus.FINISHED, StatusColor.GRAY

        if (
            self.current_season > (self.last_release_season or 0)
            and self.next_release_date
            and self.next_release_date > today
        ):
            return ShowStatus.UP_TO_DATE, StatusColor.GREEN

        if (
            (self.current_season < (self.last_release_season or 0))
            or (self.current_episode < (self.last_release_episode or 0))
            or (
                self.current_episode == self.last_release_episode
                and self.current_season == self.last_release_season
                and not self.downloaded_current_episode
            )
        ):
            return ShowStatus.BEHIND, StatusColor.RED

        return ShowStatus.UP_TO_DATE, StatusColor.GREEN


class EpisodeResponse(BaseModel):
    """Validation model for episode API responses."""

    status: Optional[bool] = None
    episode: Optional[EpisodeData] = None
