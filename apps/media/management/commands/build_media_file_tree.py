 #!/usr/bin/env python
# -*- coding: utf-8 -*-

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import os
import shutil
from apps.media.models import MediaFile

from apps.media.utils.tx import TXWrapper

class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    def handle(self, *args, **options):
        for storage in settings.STORAGE:
            for root, dirs, files in os.walk(storage, topdown=True):
                for name in files:
                    path_name = os.path.join(root, name)
                    MediaFile.create_or_update_from_path(path_name)