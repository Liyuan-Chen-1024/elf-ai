"""Command to build media file tree."""

import os

from django.core.management.base import BaseCommand

from apps.shows.models import MediaFile
from apps.shows.utils.files import list_all_possible_folders


class Command(BaseCommand):
    """Command to build media file tree."""

    help = "Build media file tree"

    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write("Building media file tree...")
        self.build_media_file_tree()
        self.stdout.write("Done building media file tree.")

    def build_media_file_tree(self):
        """Build media file tree."""
        for folder in list_all_possible_folders():
            self.process_folder(folder)

    def process_folder(self, folder: str):
        """Process a folder."""
        for root, _, files in os.walk(folder):
            for file in files:
                path = os.path.join(root, file)
                MediaFile.create_or_update_from_path(path)
