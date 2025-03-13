import logging

from django.core.management.base import BaseCommand
from django.db import models

from apps.media.models import MediaFile

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Closes the specified poll for voting"

    def remove_duplicate_media_files(self):
        media_files = (
            MediaFile.objects.values("path")
            .annotate(count=models.Count("id"))
            .filter(count__gt=1)
        )
        for media_file in media_files:
            duplicates = MediaFile.objects.filter(path=media_file["path"])
            for duplicate in duplicates[1:]:
                logging.info(f"Deleting duplicate media file: {duplicate.path}")
                duplicate.delete()

    def handle(self, *args, **options):
        self.remove_duplicate_media_files()
        for file in MediaFile.objects.all():
            file.rename_to_improved_file_pathname()
