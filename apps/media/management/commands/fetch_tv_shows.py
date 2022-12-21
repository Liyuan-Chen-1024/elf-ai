from django.core.management.base import BaseCommand, CommandError

from apps.media.models import TVShow

class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    def handle(self, *args, **options):
        for tvshow in TVShow.objects.all():
            tvshow.download_all_available_episodes_starting_at_current_episode()