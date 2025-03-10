import logging
import os

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.media.models import MediaFile

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Closes the specified poll for voting"

    def handle(self, *args, **options):
        logger.info("Starting to build media file tree")

        for storage in settings.STORAGE:
            logger.info(f"Processing storage: {storage}")
            for root, dirs, files in os.walk(storage, topdown=True):
                for name in files:
                    path_name = os.path.join(root, name)
                    logger.info(f"Processing file: {path_name}")
                    MediaFile.create_or_update_from_path(path_name)

        for file in MediaFile.objects.all():
            if not file.exists_on_disk():
                logger.info(f"Deleting missing file record: {file}")
                file.delete()

        logger.info("Finished building media file tree")
