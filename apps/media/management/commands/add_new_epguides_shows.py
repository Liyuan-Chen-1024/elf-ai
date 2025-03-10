from django.core.management.base import BaseCommand

from apps.media.utils.epguides_utils import find_and_process_new_epguide_keys


class Command(BaseCommand):
    help = "Closes the specified poll for voting"

    def handle(self, *args, **options):
        find_and_process_new_epguide_keys()
