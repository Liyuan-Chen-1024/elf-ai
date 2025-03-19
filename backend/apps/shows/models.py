import logging
import os
import time
from datetime import datetime
from typing import Any, Dict, Optional, Tuple, cast

from django.db import models
from django.utils import timezone

from apps.core.exceptions import EpguidesException
from apps.core.models import TimeStampedModel
from apps.shows.typing import ShowStatus, StatusColor
from apps.shows.utils.ai import extract_movie_title, extract_title_and_season_episode
from apps.shows.utils.fetcher import epguides_api_request
from apps.shows.utils.files import list_all_possible_folders

logger = logging.getLogger(__name__)


class MediaFile(TimeStampedModel):
    """Model for media files."""

    path: str = models.CharField(max_length=255, unique=True)
    dirname: str = models.CharField(max_length=255)
    ext: str = models.CharField(max_length=10)
    st_mode: int = models.IntegerField(null=True, blank=True)
    st_uid: int = models.IntegerField(null=True, blank=True)
    st_gid: int = models.IntegerField(null=True, blank=True)
    st_size: int = models.IntegerField(null=True, blank=True)
    st_atime: float = models.FloatField(null=True, blank=True)
    st_mtime: float = models.FloatField(null=True, blank=True)
    st_ctime: float = models.FloatField(null=True, blank=True)
    last_read_from_disk: datetime = models.DateTimeField(null=True, blank=True)
    keep: bool = models.BooleanField(default=False)
    is_movie: bool = models.BooleanField(default=False)
    renamed_from: str = models.CharField(max_length=255, null=True, blank=True)
    created_at: datetime = models.DateTimeField(auto_now_add=True)

    @classmethod
    def create_or_update_from_path(cls, path: str) -> Optional["MediaFile"]:
        """Create or update a MediaFile from a path."""
        if not os.path.exists(path):
            return None

        stats = os.stat(path)
        media_file, created = cls.objects.get_or_create(
            path=path,
            defaults={
                "st_size": stats.st_size,
            },
        )

        if not created:
            media_file.update_file_stats(stats)

        return media_file

    def get_filename(self) -> str:
        """Get the filename from the path."""
        return os.path.basename(self.path)

    def rename_dirname_if_sub_folders(self, name: str) -> str:
        """Rename directory if it contains subfolders."""
        possible_folders = list_all_possible_folders()
        if self.dirname not in possible_folders:
            for folder in possible_folders:
                if self.dirname.startswith(folder):
                    working_dir = (
                        self.dirname[len(folder) :].strip(os.sep).split(os.sep)[0]
                    )
                    os.rename(
                        os.path.join(folder, working_dir), os.path.join(folder, name)
                    )
                    self.dirname = os.path.join(folder, name)

        return self.dirname

    def rename_to_improved_file_pathname(self) -> bool:
        """Rename file to an improved pathname."""
        if self.exists_on_disk() and not self.renamed_from:
            renamed_name, ext = os.path.splitext(self.get_filename())
            if self.is_movie:
                renamed_name = extract_movie_title(renamed_name)
            else:
                renamed_name = extract_title_and_season_episode(renamed_name)

            if len(renamed_name) < 6:
                return False

            renamed_name = renamed_name + ext
            self.renamed_from = self.path

            self.rename_dirname_if_sub_folders(renamed_name)

            new_path = os.path.join(self.dirname, renamed_name)

            os.rename(self.path, new_path)
            self.path = new_path
            self.save(update_fields=["path"])
            return True

        return False

    def update_file_stats(self, stats: os.stat_result) -> None:
        """Update file statistics."""
        self.st_ctime = stats.st_ctime
        self.st_mtime = stats.st_mtime
        self.st_atime = stats.st_atime
        self.st_size = stats.st_size
        self.st_gid = stats.st_gid
        self.st_uid = stats.st_uid
        self.st_mode = stats.st_mode
        self.dirname = os.path.dirname(self.path)
        self.last_read_from_disk = datetime.now()
        self.ext = os.path.splitext(self.path)[1]
        self.keep = "/keep/" in self.path
        self.is_movie = "/movies/" in self.path
        self.save(
            update_fields=[
                "st_ctime",
                "st_mtime",
                "st_atime",
                "st_size",
                "st_gid",
                "st_uid",
                "st_mode",
                "dirname",
                "last_read_from_disk",
                "ext",
                "keep",
                "is_movie",
            ]
        )

    def __str__(self) -> str:
        """String representation."""
        return self.path

    def exists_on_disk(self) -> bool:
        """Check if file exists on disk."""
        return os.path.exists(self.path)

    def remove_from_disk(self) -> bool:
        """Remove file from disk."""
        if self.exists_on_disk():
            os.remove(self.path)
            self.delete()
            return True
        return False


class TVShow(TimeStampedModel):
    """Model for TV shows."""

    epguide_name: str = models.CharField(max_length=255, unique=True)
    full_name: str = models.CharField(max_length=255)
    current_season: int = models.IntegerField(default=1)
    current_episode: int = models.IntegerField(default=1)
    active: bool = models.BooleanField(default=False)
    keep: bool = models.BooleanField(default=False)
    datetime_edited: datetime = models.DateTimeField(auto_now=True)
    datetime_added: datetime = models.DateTimeField(auto_now_add=True)
    downloaded_current_episode: bool = models.BooleanField(default=False)
    episode_lookup_type: str = models.CharField(max_length=32, default="epguides")
    first_release_date: Optional[datetime] = models.DateTimeField(null=True, blank=True)
    last_release_date: Optional[datetime] = models.DateTimeField(null=True, blank=True)
    last_release_season: Optional[int] = models.IntegerField(null=True, blank=True)
    last_release_episode: Optional[int] = models.IntegerField(null=True, blank=True)
    next_release_date: Optional[datetime] = models.DateTimeField(null=True, blank=True)
    created_at: datetime = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["full_name"]

    def __str__(self) -> str:
        """String representation."""
        return f"{self.epguide_name} {self.full_name}"

    def key_season_episode(self) -> str:
        """Get season and episode key."""
        return f"{self.epguide_name}/{self.current_season}/{self.current_episode}"

    def fetch_current_episode(self) -> Optional[Dict[str, Any]]:
        """Fetch current episode data."""
        response = epguides_api_request(f"show/{self.key_season_episode()}")
        return response.get("episode") if response else None

    def update_last_next_and_first_episodes_data(self) -> None:
        self.update_last_episode_data()
        self.update_next_episode_data()
        self.update_first_episode_data()
        self.save()

    def update_last_episode_data(self) -> None:
        response = epguides_api_request(f"show/{self.epguide_name}/last/")
        if response:
            last_episode = response["episode"]
            self.last_release_date = last_episode["release_date"]
            self.last_release_season = last_episode["season"]
            self.last_release_episode = last_episode["number"]

    def update_next_episode_data(self) -> None:
        next_episode = self.get_next_episode()
        if next_episode:
            self.next_release_date = next_episode["release_date"]

    def update_first_episode_data(self) -> None:
        if not self.first_release_date:
            response = epguides_api_request(f"show/{self.epguide_name}/first/")
            if (
                response
                and "episode" in response
                and "release_date" in response["episode"]
            ):
                self.first_release_date = response["episode"]["release_date"]

    def get_service(self) -> Any:
        """Get the TV show service instance."""
        from .services.tv_show_service import TVShowService

        return TVShowService()

    def download_current_episode(self) -> bool:
        """Download current episode."""
        return self.get_service().download_current_episode(self)

    def get_next_episode(self) -> Optional[Dict[str, Any]]:
        """Get next episode data."""
        try:
            response = epguides_api_request(f"show/{self.key_season_episode()}/next/")
            return response.get("episode") if response else None
        except EpguidesException:
            return None

    def next_episode_released(self) -> bool:
        """Check if next episode has been released."""
        try:
            response = epguides_api_request(
                f"show/{self.key_season_episode()}/next/released/"
            )
            return bool(response.get("status")) if response else False
        except EpguidesException:
            return False

    def download_all_available_episodes_starting_at_current_episode(self) -> None:
        """Download all available episodes starting from current."""
        self.get_service().download_all_available_episodes(self)

    def get_status(self) -> Tuple[ShowStatus, StatusColor]:
        """Get show status."""
        service = self.get_service()
        return service.get_show_status(self)

    def update_metadata(self) -> None:
        """Update show metadata."""
        self.get_service().update_show_metadata(self)

    def update_next_episode(self) -> None:
        """Update next episode information."""
        next_episode = self.get_next_episode()
        if next_episode:
            self.next_season = cast(int, next_episode.get("season"))
            self.next_episode = cast(int, next_episode.get("episode"))
            self.next_release_date = next_episode.get("release_date")
            self.save(
                update_fields=["next_season", "next_episode", "next_release_date"]
            )

    def update_last_episode(self) -> None:
        """Update last episode information."""
        try:
            response = epguides_api_request(f"show/{self.epguide_name}/last/")
            if response and response.get("episode"):
                episode = response["episode"]
                self.last_release_season = cast(int, episode.get("season"))
                self.last_release_episode = cast(int, episode.get("episode"))
                self.last_release_date = episode.get("release_date")
                self.save(
                    update_fields=[
                        "last_release_season",
                        "last_release_episode",
                        "last_release_date",
                    ]
                )
        except EpguidesException:
            pass

    def update_show_info(self) -> None:
        """Update show information."""
        try:
            response = epguides_api_request(f"show/{self.epguide_name}/info/")
            if response and response.get("show"):
                show = response["show"]
                self.full_name = cast(str, show.get("name"))
                self.save(update_fields=["full_name"])
        except EpguidesException:
            pass

    def check_and_update_if_behind(self) -> None:
        """Check and update if show is behind."""
        if self.current_episode_released():
            self.downloaded_current_episode = True
            self.save(update_fields=["downloaded_current_episode"])

            if self.next_episode_released():
                self.current_season = self.next_season
                self.current_episode = self.next_episode
                self.downloaded_current_episode = False
                self.save(
                    update_fields=[
                        "current_season",
                        "current_episode",
                        "downloaded_current_episode",
                    ]
                )
                self.download_all_available_episodes_starting_at_current_episode()

    def current_episode_released(self) -> bool:
        """Check if current episode has been released."""
        try:
            response = epguides_api_request(
                f"show/{self.key_season_episode()}/released/"
            )
            return bool(response.get("status")) if response else False
        except EpguidesException:
            return False

    def fetch_best_magnet_for_current_episode(self) -> Optional[str]:
        """Fetch best magnet for current episode."""
        return self.get_service()._fetch_best_magnet_for_current_episode(self)
