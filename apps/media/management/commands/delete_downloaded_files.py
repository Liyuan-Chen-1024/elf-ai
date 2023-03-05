#!/usr/bin/env python
# -*- coding: utf-8 -*-

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import os

from apps.media.utils.tx import TXWrapper

class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    def handle(self, *args, **options):
        for storage in settings.STORAGE:
            execute(os.path.join(storage, 'tvshows'))

file_extensions_to_delete = [".exe", ".rar", ".nfo", ".jpg", ".jpeg", "mp3", ".url", ".txt"]


def delete_unwanted_files(path):
    for root, dirs, files in os.walk(path, topdown=True):
        print(root)
        for name in files:
            print(name)
            path_name = os.path.join(root, name)
            for ext in file_extensions_to_delete:
                if ext in path_name:
                    os.remove(path_name)        

def unrar_files(path):
    pass

def delete_empty_directories(path):
    pass

def delete_e0080p(path):
    pass

def execute(path):
    unrar_files(path)
    delete_unwanted_files(path)
    delete_empty_directories(path)
    delete_e0080p(path)