import os
import logging
import logging.config
from django.conf import settings
import random

def get_tv_folder(keep=False):
    storage = random.choice(settings.storage)
    if keep:
        storage = os.path.join(storage, '/keep/')
    return os.path.join(storage, '/tvshows/')

def get_movie_folder(keep=False):
    storage = random.choice(settings.storage)
    if keep:
        storage = os.path.join(storage, '/keep/')
    return os.path.join(storage, '/movies/')

