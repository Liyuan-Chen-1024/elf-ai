"""Command to delete unwanted files."""

from apps.core.logging import get_logger
from typing import Any, Dict, Optional

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.shows.utils.files import (
    delete_empty_directories,
    delete_small_video_files,
    delete_unwanted_directories,
)

logger = get_logger(__name__)


class Command(BaseCommand):
    """Command to delete unwanted files."""

    help = """
    Deletes unwanted files and directories from configured storage locations.
    Can delete:
    - Empty directories
    - Small video files (configurable size threshold)
    - Unwanted directories (screenshots, samples, etc.)
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting",
        )
        parser.add_argument(
            "--min-video-size",
            type=int,
            default=100,
            help="Minimum video file size in MB (default: 100)",
        )
        parser.add_argument(
            "--storage",
            type=str,
            help="Process specific storage path instead of all configured storage paths",
        )

    def handle(self, *args: Any, **options: Dict[str, Any]) -> Optional[str]:
        """Execute the command."""
        self.stdout.write("Starting to delete unwanted files...")

        dry_run = options["dry_run"]
        min_video_size = options["min_video_size"] * 1024 * 1024  # Convert MB to bytes
        specific_storage = options["storage"]

        if dry_run:
            logger.info("DRY RUN MODE - No files will be deleted")

        storage_paths = [specific_storage] if specific_storage else settings.STORAGE

        stats = {"unwanted_dirs": 0, "empty_dirs": 0, "small_videos": 0, "errors": 0}

        for storage in storage_paths:
            try:
                logger.info(f"Processing storage: {storage}")

                # Delete unwanted directories
                deleted_dirs = delete_unwanted_directories(storage, dry_run=dry_run)
                stats["unwanted_dirs"] += deleted_dirs

                # Delete empty directories
                deleted_empty = delete_empty_directories(storage, dry_run=dry_run)
                stats["empty_dirs"] += deleted_empty

                # Delete small video files
                deleted_videos = delete_small_video_files(
                    storage, min_size=min_video_size, dry_run=dry_run
                )
                stats["small_videos"] += deleted_videos

            except Exception as e:
                logger.error(f"Error processing {storage}: {str(e)}")
                stats["errors"] += 1
                continue

        # Report statistics
        logger.info("\nOperation Summary:")
        logger.info(f"- Unwanted directories removed: {stats['unwanted_dirs']}")
        logger.info(f"- Empty directories removed: {stats['empty_dirs']}")
        logger.info(f"- Small video files removed: {stats['small_videos']}")
        if stats["errors"]:
            logger.warning(f"- Errors encountered: {stats['errors']}")

        if dry_run:
            logger.info("\nThis was a dry run - no files were actually deleted")

        self.stdout.write("Done deleting unwanted files.")

    def process_folder(self, folder: str):
        """Process a folder."""
        # Implementation here
        pass
