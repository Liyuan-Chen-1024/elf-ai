"""Service layer for media file operations."""

import os
from typing import Optional, Set


from apps.core.logging import get_logger
from apps.core.services import BaseService
from apps.shows.models import MediaFile
from apps.shows.utils.ai import extract_movie_title, extract_title_and_season_episode
from apps.shows.utils.files import list_all_possible_folders

logger = get_logger(__name__)


class MediaFileService(BaseService):
    """Service for managing media file operations."""

    def create_or_update_from_path(self, path: str) -> Optional[MediaFile]:
        """Create or update a MediaFile from a path.

        Args:
            path: File path to process

        Returns:
            MediaFile instance if successful, None otherwise
        """
        try:
            media_file, created = MediaFile.objects.get_or_create(path=path)
            if media_file.exists_on_disk():
                stats = os.stat(path)
                if (
                    stats.st_mtime
                    and media_file.last_read_from_disk
                    and media_file.last_read_from_disk > stats.st_mtime
                ):
                    return media_file

                media_file.update_file_stats(stats)
                media_file.save()
                return media_file
            else:
                media_file.delete()
                return None
        except Exception as e:
            logger.error(f"Error processing file {path}: {str(e)}")
            return None

    def rename_dirname_if_sub_folders(self, media_file: MediaFile, name: str) -> str:
        """Rename directory if it's in a subfolder.

        Args:
            media_file: MediaFile instance
            name: New directory name

        Returns:
            Updated dirname
        """
        possible_folders = list_all_possible_folders()
        if media_file.dirname not in possible_folders:
            for folder in possible_folders:
                if media_file.dirname.startswith(folder):
                    working_dir = (
                        media_file.dirname[len(folder) :].strip(os.sep).split(os.sep)[0]
                    )
                    os.rename(
                        os.path.join(folder, working_dir), os.path.join(folder, name)
                    )
                    media_file.dirname = os.path.join(folder, name)
                    media_file.save()
                    break

        return media_file.dirname

    def rename_to_improved_pathname(self, media_file: MediaFile) -> bool:
        """Rename file to improved pathname.

        Args:
            media_file: MediaFile instance

        Returns:
            True if renamed successfully, False otherwise
        """
        try:
            if media_file.exists_on_disk() and not media_file.renamed_from:
                renamed_name, ext = os.path.splitext(media_file.get_filename())
                if media_file.is_movie:
                    renamed_name = extract_movie_title(renamed_name)
                else:
                    renamed_name = extract_title_and_season_episode(renamed_name)

                if len(renamed_name) < 6:
                    return False

                renamed_name = renamed_name + ext
                media_file.renamed_from = media_file.path

                self.rename_dirname_if_sub_folders(media_file, renamed_name)

                new_path = os.path.join(media_file.dirname, renamed_name)
                os.rename(media_file.path, new_path)
                media_file.path = new_path
                media_file.save()
                return True

            return False
        except Exception as e:
            logger.error(f"Error renaming {media_file.path}: {str(e)}")
            return False

    def remove_from_disk(self, media_file: MediaFile) -> bool:
        """Remove file from disk.

        Args:
            media_file: MediaFile instance

        Returns:
            True if removed successfully, False otherwise
        """
        try:
            if media_file.exists_on_disk():
                os.remove(media_file.path)
                media_file.delete()
                return True
            return False
        except Exception as e:
            logger.error(f"Error removing {media_file.path}: {str(e)}")
            return False

    def scan_media_files(self) -> None:
        """Scan all media files in configured directories."""
        scanned_paths: Set[str] = set()

        for folder in list_all_possible_folders():
            if not os.path.exists(folder):
                continue

            for root, _, files in os.walk(folder):
                for file in files:
                    path = os.path.join(root, file)
                    scanned_paths.add(path)
                    MediaFile.create_or_update_from_path(path)

        # Delete files that no longer exist
        for media_file in MediaFile.objects.all():
            if media_file.path not in scanned_paths:
                media_file.delete()

    def cleanup_empty_folders(self) -> None:
        """Remove empty folders in media directories."""
        for folder in list_all_possible_folders():
            if not os.path.exists(folder):
                continue

            for root, dirs, files in os.walk(folder, topdown=False):
                for dir_name in dirs:
                    dir_path = os.path.join(root, dir_name)
                    try:
                        if not os.listdir(dir_path):
                            os.rmdir(dir_path)
                            logger.info(f"Removed empty directory: {dir_path}")
                    except OSError as e:
                        logger.error(f"Error removing directory {dir_path}: {str(e)}")

    def rename_all_files(self) -> None:
        """Rename all media files to improved pathnames."""
        for media_file in MediaFile.objects.all():
            try:
                if media_file.rename_to_improved_file_pathname():
                    logger.info(f"Renamed file: {media_file.path}")
            except OSError as e:
                logger.error(f"Error renaming file {media_file.path}: {str(e)}")

    def update_file_stats(self, media_file: MediaFile) -> None:
        """Update statistics for a media file."""
        if not media_file.exists_on_disk():
            media_file.delete()
            return

        try:
            stats = os.stat(media_file.path)
            media_file.update_file_stats(stats)
            logger.info(f"Updated stats for file: {media_file.path}")
        except OSError as e:
            logger.error(f"Error updating stats for file {media_file.path}: {str(e)}")
            media_file.delete()
