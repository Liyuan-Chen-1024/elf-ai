import os

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.media.utils.ai import extract_title_and_season_episode


class Command(BaseCommand):
    help = "Closes the specified poll for voting"

    def handle(self, *args, **options):
        for storage in settings.STORAGE:
            rename(storage)


def rename(path):
    rename_dirs(path)
    rename_files(path)


def rename_files(path):
    for root, dirs, files in os.walk(path, topdown=True):
        for name in files:
            path_name = os.path.join(root, name)
            if ".txt" in path_name:
                continue
            if ".part" in path_name:
                continue

            renamed_name, ext = os.path.splitext(name)
            renamed_name = extract_title_and_season_episode(renamed_name)
            renamed_name = renamed_name + ext

            if (
                len(renamed_name) > 4
                and renamed_name != name
                and renamed_name[len(renamed_name) - 2] != "~"
            ):
                try:
                    print(
                        "moving file",
                        path_name,
                        " to ",
                        os.path.join(root, renamed_name),
                    )
                    os.rename(path_name, os.path.join(root, renamed_name))
                except Exception as e:
                    print("failed moving file", path_name)
                    print(e)


def rename_dirs(path):
    for root, dirs, files in os.walk(path, topdown=True):
        for name in dirs:
            path_name = os.path.join(root, name)

            if ".txt" in path_name:
                continue
            if ".part" in path_name:
                continue

            if not os.path.isdir(path_name):
                continue

            inner_files = os.listdir(path_name)

            skip_dir = False
            for inner_file in inner_files:
                if ".part" in inner_file:
                    skip_dir = True
                if skip_dir:
                    continue

            renamed_name = name
            renamed_name = extract_title_and_season_episode(renamed_name)

            if (
                len(renamed_name) > 4
                and renamed_name != name
                and renamed_name[len(renamed_name) - 2] != "~"
            ):
                try:
                    print(
                        "moving dir",
                        path_name,
                        " to ",
                        os.path.join(root, renamed_name),
                    )
                    os.rename(path_name, os.path.join(root, renamed_name))
                except Exception as e:
                    print("failed moving", path_name)
                    print(e)
