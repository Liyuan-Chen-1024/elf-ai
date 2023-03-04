from django.core.management.base import BaseCommand, CommandError

from apps.media.models import TVShow
from apps.media.utils.exceptions import ShowNotFoundException

class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    def handle(self, *args, **options):
        for tvshow in TVShow.objects.all():
            try:
                tvshow.download_all_available_episodes_starting_at_current_episode()
            except ShowNotFoundException:
                print("Show not found: {0}".format(tvshow.epguide_name))
                pass
