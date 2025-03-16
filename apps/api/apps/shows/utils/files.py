import logging
import os
import random
import shutil
from typing import List, Optional, Set
from pathlib import Path

from django.conf import settings

UNWANTED_DIR_NAMES = {"screenshots", "screens", "samples", "extras"}

logger = logging.getLogger(__name__)


def delete_unwanted_directories(path, dry_run=False):
    deleted_count = 0
    for root, dirs, _ in os.walk(path, topdown=True):
        for name in dirs:
            path_name = os.path.join(root, name)
            if name in UNWANTED_DIR_NAMES:
                logger.info(f"{'Would delete' if dry_run else 'Deleting'} directory: {path_name}")
                if not dry_run:
                    shutil.rmtree(path_name)
                deleted_count += 1
    return deleted_count


def delete_empty_directories(path, dry_run=False):
    deleted_count = 0
    for root, dirs, _ in os.walk(path, topdown=True):
        for name in dirs:
            path_name = os.path.join(root, name)
            if not os.listdir(path_name):
                logger.info(f"{'Would delete' if dry_run else 'Deleting'} empty directory: {path_name}")
                if not dry_run:
                    os.rmdir(path_name)
                deleted_count += 1
    return deleted_count


def delete_small_video_files(path, min_size=100000000, dry_run=False):
    video_files = ["avi", "m4v", "mkv", "mp4"]
    deleted_count = 0

    for root, _, files in os.walk(path, topdown=True):
        for file in files:
            if any(file.endswith(ext) for ext in video_files):
                file_path = os.path.join(root, file)
                try:
                    file_size = os.path.getsize(file_path)
                    if file_size < min_size:
                        size_mb = file_size / (1024 * 1024)
                        logger.info(
                            f"{'Would delete' if dry_run else 'Deleting'} small video file: {file_path} ({size_mb:.2f} MB)"
                        )
                        if not dry_run:
                            os.remove(file_path)
                        deleted_count += 1
                except OSError as e:
                    logger.error(f"Error processing file {file_path}: {str(e)}")
    return deleted_count


def get_tv_folder(keep: bool = False) -> str:
    """Get the appropriate TV folder path."""
    storage = random.choice(settings.STORAGE)
    if keep:
        storage = os.path.join(storage, "keep/")
    return os.path.join(storage, "tvshows/")


def get_movie_folder(keep=False):
    storage = random.choice(settings.STORAGE)
    if keep:
        storage = os.path.join(storage, "keep/")
    return os.path.join(storage, "movies/")


def list_all_possible_folders() -> List[str]:
    """List all possible media folders."""
    folders = []
    for storage in settings.STORAGE:
        folders.append(os.path.join(storage, "tvshows/"))
        folders.append(os.path.join(storage, "movies/"))
        folders.append(os.path.join(storage, "keep/tvshows/"))
        folders.append(os.path.join(storage, "keep/movies/"))
    return folders


def ensure_directory_exists(path: str) -> None:
    """Ensure a directory exists, creating it if necessary."""
    os.makedirs(path, exist_ok=True)


def get_file_extension(filename: str) -> str:
    """Get the extension of a file."""
    return os.path.splitext(filename)[1].lower()


def is_video_file(filename: str) -> bool:
    """Check if a file is a video file."""
    video_extensions = {'.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.m4v'}
    return get_file_extension(filename) in video_extensions


def is_subtitle_file(filename: str) -> bool:
    """Check if a file is a subtitle file."""
    subtitle_extensions = {'.srt', '.sub', '.ass', '.ssa'}
    return get_file_extension(filename) in subtitle_extensions


def get_relative_path(path: str, base_path: Optional[str] = None) -> str:
    """Get the relative path from a base path."""
    if base_path is None:
        base_path = str(settings.MEDIA_ROOT)
    return str(Path(path).relative_to(base_path))


def get_absolute_path(relative_path: str, base_path: Optional[str] = None) -> str:
    """Get the absolute path from a relative path."""
    if base_path is None:
        base_path = str(settings.MEDIA_ROOT)
    return str(Path(base_path) / relative_path)


def get_parent_directory(path: str) -> str:
    """Get the parent directory of a path."""
    return str(Path(path).parent)


def get_filename(path: str) -> str:
    """Get the filename from a path."""
    return str(Path(path).name)


def get_filename_without_extension(path: str) -> str:
    """Get the filename without extension from a path."""
    return str(Path(path).stem)


def get_directory_size(path: str) -> int:
    """Get the total size of a directory in bytes."""
    total_size = 0
    for dirpath, _, filenames in os.walk(path):
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            try:
                total_size += os.path.getsize(file_path)
            except OSError:
                continue
    return total_size


def list_directory_contents(path: str) -> Set[str]:
    """List all files in a directory recursively."""
    contents = set()
    for dirpath, _, filenames in os.walk(path):
        for filename in filenames:
            contents.add(os.path.join(dirpath, filename))
    return contents
