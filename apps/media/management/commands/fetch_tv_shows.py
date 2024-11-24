from django.core.management.base import BaseCommand

from apps.media.models import TVShow
from apps.media.utils.exceptions import ShowNotFoundException


class Command(BaseCommand):
    def handle(self, *args, **options):
        print("Starting")
        for tvshow in TVShow.objects.all():
            print(tvshow)
            try:
                tvshow.download_all_available_episodes_starting_at_current_episode()
            except ShowNotFoundException:
                print("Show not found: {0}".format(tvshow.epguide_name))
                pass
