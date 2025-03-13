import os

from django.core.management.base import BaseCommand

from apps.media.models import MediaFile
from apps.media.utils.files import remove_duplicate_media_files


class Command(BaseCommand):
    help = "Closes the specified poll for voting"

    def handle(self, *args, **options):
        remove_duplicate_media_files()
        for file in MediaFile.objects.all():
            file.rename_to_improved_file_pathname()
