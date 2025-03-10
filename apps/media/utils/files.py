import logging
import os
import random
import shutil

from django.conf import settings

VIDEO_FILE_EXTENSIONS = {
    ".mp4",
    ".mkv",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".vob",
    ".ogv",
    ".ogg",
    ".drc",
    ".mng",
    ".mts",
    ".m2ts",
    ".ts",
    ".m4v",
    ".3gp",
    ".3g2",
    ".nsv",
}

UNWANTED_DIR_NAMES = {"screenshots", "screens", "samples", "extras"}


def delete_non_video_files(path):
    for root, _, files in os.walk(path, topdown=True):
        for name in files:
            path_name = os.path.join(root, name)
            if not any(path_name.endswith(ext) for ext in VIDEO_FILE_EXTENSIONS):
                logging.info(f"Deleting file: {path_name}")
                os.remove(path_name)


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
