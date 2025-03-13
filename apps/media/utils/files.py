import logging
import os
import random
import shutil

from django.conf import settings

UNWANTED_DIR_NAMES = {"screenshots", "screens", "samples", "extras"}

logger = logging.getLogger(__name__)


def delete_unwanted_directories(path):
    for root, dirs, _ in os.walk(path, topdown=True):
        for name in dirs:
            path_name = os.path.join(root, name)
            if name in UNWANTED_DIR_NAMES:
                logger.info(f"Deleting directory: {path_name}")
                shutil.rmtree(path_name)


def delete_empty_directories(path):
    for root, dirs, _ in os.walk(path, topdown=True):
        for name in dirs:
            path_name = os.path.join(root, name)
            if not os.listdir(path_name):
                logger.info(f"Deleting empty directory: {path_name}")
                os.rmdir(path_name)


def delete_small_video_files(path):
    video_files = ["avi", "m4v", "mkv", "mp4"]

    for root, _, files in os.walk(path, topdown=True):
        for file in files:
            if any(file.endswith(ext) for ext in video_files):
                file_path = os.path.join(root, file)
                if os.path.getsize(file_path) < 100000000:  # 100MB
                    logger.info(f"Deleting small video file: {file_path}")
                    os.remove(file_path)


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
