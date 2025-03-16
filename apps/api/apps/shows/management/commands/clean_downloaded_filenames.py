"""Command to clean downloaded filenames."""
import logging
from typing import Any, Dict, Optional

from django.core.management.base import BaseCommand, CommandError
from django.db import models, transaction
from tqdm import tqdm

from apps.shows.models import MediaFile

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Command to clean downloaded filenames."""

    help = """
    Cleans up downloaded media file names:
    - Removes duplicate MediaFile entries
    - Renames files to a standardized format
    - For TV shows: Title SXXEYY format
    - For movies: Title (Year) format
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be renamed without actually renaming",
        )
        parser.add_argument(
            "--quiet",
            action="store_true",
            help="Suppress progress bar and non-error output",
        )

    def remove_duplicate_media_files(self, quiet: bool = False) -> int:
        """Remove duplicate MediaFile entries and return count of removed duplicates."""
        removed_count = 0
        
        # Find duplicates
        media_files = (
            MediaFile.objects.values("path")
            .annotate(count=models.Count("id"))
            .filter(count__gt=1)
        )
        
        if not quiet:
            self.stdout.write(f"Found {len(media_files)} files with duplicates")
        
        # Remove duplicates
        for media_file in media_files:
            duplicates = MediaFile.objects.filter(path=media_file["path"])
            # Keep the first one, delete the rest
            for duplicate in duplicates[1:]:
                if not quiet:
                    self.stdout.write(f"Removing duplicate: {duplicate.path}")
                duplicate.delete()
                removed_count += 1
        
        return removed_count

    def handle(self, *args: Any, **options: Any) -> Optional[str]:
        """Execute the command."""
        quiet = options["quiet"]
        dry_run = options["dry_run"]
        stats = {"duplicates_removed": 0, "files_renamed": 0, "errors": 0}
        
        try:
            if not quiet:
                self.stdout.write("Starting filename cleanup...")
            
            # Remove duplicates first
            with transaction.atomic():
                stats["duplicates_removed"] = self.remove_duplicate_media_files(quiet)
            
            # Process all files
            total_files = MediaFile.objects.count()
            with tqdm(total=total_files, disable=quiet) as pbar:
                for file in MediaFile.objects.iterator():
                    try:
                        if dry_run:
                            # Just simulate the rename
                            old_path = file.path
                            file.rename_to_improved_file_pathname()
                            if old_path != file.path:
                                stats["files_renamed"] += 1
                                if not quiet:
                                    self.stdout.write(f"Would rename: {old_path} -> {file.path}")
                            file.refresh_from_db()  # Revert changes
                        else:
                            # Actually perform the rename
                            old_path = file.path
                            file.rename_to_improved_file_pathname()
                            if old_path != file.path:
                                stats["files_renamed"] += 1
                                if not quiet:
                                    self.stdout.write(f"Renamed: {old_path} -> {file.path}")
                    
                    except Exception as e:
                        logger.error(f"Error processing {file.path}: {str(e)}")
                        stats["errors"] += 1
                    
                    pbar.update(1)
            
            # Report results
            if not quiet:
                self.stdout.write(self.style.SUCCESS(
                    f"\nOperation completed {'(dry run) ' if dry_run else ''}successfully:"
                    f"\n- Duplicates removed: {stats['duplicates_removed']}"
                    f"\n- Files {'would be ' if dry_run else ''}renamed: {stats['files_renamed']}"
                ))
            
            if stats["errors"] > 0:
                self.stdout.write(
                    self.style.WARNING(f"\nEncountered {stats['errors']} errors during processing")
                )
        
        except Exception as e:
            raise CommandError(f"Command failed: {str(e)}")
