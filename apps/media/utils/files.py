import logging
import os
import random
import shutil

from django.conf import settings
from django.db import models

from apps.media.models import MediaFile

UNWANTED_DIR_NAMES = {"screenshots", "screens", "samples", "extras"}


def delete_unwanted_directories(path):
    for root, dirs, _ in os.walk(path, topdown=True):
        for name in dirs:
            path_name = os.path.join(root, name)
            if name in UNWANTED_DIR_NAMES:
                logging.info(f"Deleting directory: {path_name}")
                shutil.rmtree(path_name)


def delete_empty_directories(path):
    for root, dirs, _ in os.walk(path, topdown=True):
        for name in dirs:
            path_name = os.path.join(root, name)
            if not os.listdir(path_name):
                logging.info(f"Deleting empty directory: {path_name}")
                os.rmdir(path_name)


def delete_small_video_files(path):
    video_files = ["avi", "m4v", "mkv", "mp4"]

    for root, _, files in os.walk(path, topdown=True):
        for file in files:
            if any(file.endswith(ext) for ext in video_files):
                file_path = os.path.join(root, file)
                if os.path.getsize(file_path) < 100000000:  # 100MB
                    logging.info(f"Deleting small video file: {file_path}")
                    os.remove(file_path)


def remove_duplicate_media_files():
    media_files = (
        MediaFile.objects.values("path")
        .annotate(count=models.Count("id"))
        .filter(count__gt=1)
    )
    for media_file in media_files:
        duplicates = MediaFile.objects.filter(path=media_file["path"])
        for duplicate in duplicates[1:]:
            logging.info(f"Deleting duplicate media file: {duplicate.path}")
            duplicate.delete()


def get_tv_folder(keep=False):
    storage = random.choice(settings.STORAGE)
    if keep:
        storage = os.path.join(storage, "keep/")
    return os.path.join(storage, "tvshows/")


def get_movie_folder(keep=False):
    storage = random.choice(settings.STORAGE)
    if keep:
        storage = os.path.join(storage, "keep/")
    return os.path.join(storage, "movies/")
