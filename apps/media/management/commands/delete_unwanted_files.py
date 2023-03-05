#!/usr/bin/env python
# -*- coding: utf-8 -*-

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
import os
import shutil

from apps.media.utils.tx import TXWrapper

class Command(BaseCommand):
    help = 'Closes the specified poll for voting'

    def handle(self, *args, **options):
        for storage in settings.STORAGE:
            execute(storage)

file_extensions_to_delete = [".exe", ".rar", ".nfo", ".jpg", ".jpeg", 
                             "mp3", ".url", ".txt", ".png", ".sfv"]

unwanted_dir_names = ["screenshots", "screens"]

def delete_unwanted_files(path):
    for root, dirs, files in os.walk(path, topdown=True):
        for name in files:
            path_name = os.path.join(root, name)
            for ext in file_extensions_to_delete:
                if ext in path_name:
                    print("rm {0}", path_name)
                    os.remove(path_name)        

def delete_unwanted_directories(path):
    for root, dirs, files in os.walk(path, topdown=True):
        for name in dirs:
            path_name = os.path.join(root, name)
            if name in unwanted_dir_names:
                print("rmtree {0}", path_name)
                shutil.rmtree(path_name)

def delete_empty_directories(path):
    for root, dirs, files in os.walk(path, topdown=True):
        for name in dirs:
            path_name = os.path.join(root, name)
            if(len(os.listdir(path_name)) == 0):
                print("rmdir {0}", path_name)
                os.rmdir(path_name)

def execute(path):
    delete_unwanted_files(path)
    delete_unwanted_directories(path)
    delete_empty_directories(path)
