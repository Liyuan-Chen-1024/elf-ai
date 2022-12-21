from django.core.management.base import BaseCommand, CommandError

from apps.media.utils.tx import TXWrapper

class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    def handle(self, *args, **options):
        TXWrapper.manage_queue()