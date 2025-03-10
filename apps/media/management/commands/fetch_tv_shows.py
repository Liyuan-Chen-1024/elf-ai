import logging

from django.core.management.base import BaseCommand

from apps.media.models import TVShow
from core.exceptions import ShowNotFoundException

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def handle(self, *args, **options):
        logger.info("Starting")
        for tvshow in TVShow.objects.all():
            logger.info(f"Processing TV show: {tvshow}")
            try:
                tvshow.download_all_available_episodes_starting_at_current_episode()
            except ShowNotFoundException:
                logger.error(f"Show not found: {tvshow.epguide_name}")
