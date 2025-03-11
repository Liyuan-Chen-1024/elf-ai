import logging

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.media.utils.files import delete_empty_directories, delete_unwanted_directories

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Deletes unwanted files and directories"

    def handle(self, *args, **options):
        logger.info("Starting to delete unwanted files and directories")

        for storage in settings.STORAGE:
            logger.info(f"Processing storage: {storage}")
            delete_unwanted_directories(storage)
            delete_empty_directories(storage)

        logger.info("Finished deleting unwanted files and directories")
