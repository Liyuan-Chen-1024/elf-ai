import datetime
import logging
import os
import random
import re
import time

import requests
from bs4 import BeautifulSoup
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.media.utils.exceptions import EpguidesException
from apps.media.utils.fetcher import epguides_api_request
from apps.media.utils.files import get_tv_folder
from apps.media.utils.tx import TXWrapper

LOGGING_CONF = os.path.join(settings.BASE_DIR, "logging.ini")
logging.config.fileConfig(LOGGING_CONF)
log = logging.getLogger("applog")


class MediaFile(models.Model):
    path = models.TextField()
    dirname = models.TextField(null=True, blank=True)
    ext = models.CharField(null=True, blank=True, max_length=20)
    st_mode = models.BigIntegerField(null=True, blank=True)
    st_uid = models.BigIntegerField(null=True, blank=True)
    st_gid = models.BigIntegerField(null=True, blank=True)
    st_size = models.BigIntegerField(null=True, blank=True)
    st_atime = models.BigIntegerField(null=True, blank=True)
    st_mtime = models.BigIntegerField(null=True, blank=True)
    st_ctime = models.BigIntegerField(null=True, blank=True)
    last_read_from_disk = models.BigIntegerField(null=True, blank=True)
    keep = models.BooleanField(default=False)
    is_movie = models.BooleanField(default=False)

    @staticmethod
    def create_or_update_from_path(path):
        media_file, created = MediaFile.objects.get_or_create(path=path)
        if media_file.exists_on_disk():
            stats = os.stat(path)
            if (
                stats.st_mtime
                and media_file.last_read_from_disk
                and media_file.last_read_from_disk > stats.st_mtime
            ):
                return

            media_file.update_file_stats(stats)
            media_file.save()
        else:
            media_file.delete()

    def update_file_stats(self, stats):
        self.st_ctime = stats.st_ctime
        self.st_mtime = stats.st_mtime
        self.st_atime = stats.st_atime
        self.st_size = stats.st_size
        self.st_gid = stats.st_gid
        self.st_uid = stats.st_uid
        self.st_mode = stats.st_mode
        self.dirname = os.path.dirname(self.path)
        self.last_read_from_disk = time.time()
        self.ext = os.path.splitext(self.path)[1]
        self.keep = "/keep/" in self.path
        self.is_movie = "/movies/" in self.path

    def __str__(self):
        return self.path

    def exists_on_disk(self):
        return os.path.exists(self.path)

    def remove_from_disk(self):
        os.remove(self.path)
        self.delete()


class TVShow(models.Model):
    epguide_name = models.CharField(max_length=250)
    full_name = models.CharField(max_length=250)
    current_season = models.IntegerField(default=1)
    current_episode = models.IntegerField(default=1)
    active = models.BooleanField(default=False)
    keep = models.BooleanField(default=False)
    datetime_edited = models.DateTimeField(default=timezone.now)
    datetime_added = models.DateTimeField(default=timezone.now)
    downloaded_current_episode = models.BooleanField(default=False)
    episode_lookup_type = models.CharField(default="number", max_length=255)
    first_release_date = models.DateField(null=True)
    last_release_date = models.DateField(null=True)
    last_release_season = models.IntegerField(null=True)
    last_release_episode = models.IntegerField(null=True)
    next_release_date = models.DateField(null=True)

    def __str__(self):
        return f"{self.epguide_name} {self.full_name}"

    @property
    def key_season_episode(self) -> str:
        return f"{self.epguide_name}/{self.current_season}/{self.current_episode}"

    def fetch_current_episode(self):
        response = epguides_api_request(f"show/{self.key_season_episode}")
        return response.get("episode") if response else None

    def update_last_next_and_first_episodes_data(self):
        self.update_last_episode_data()
        self.update_next_episode_data()
        self.update_first_episode_data()
        self.save()

    def update_last_episode_data(self):
        response = epguides_api_request(f"show/{self.epguide_name}/last/")
        if response:
            last_episode = response["episode"]
            self.last_release_date = last_episode["release_date"]
            self.last_release_season = last_episode["season"]
            self.last_release_episode = last_episode["number"]

    def update_next_episode_data(self):
        next_episode = self.get_next_episode()
        print(next_episode)
        if next_episode:
            self.next_release_date = next_episode["release_date"]

    def update_first_episode_data(self):
        if not self.first_release_date:
            response = epguides_api_request(f"show/{self.epguide_name}/first/")
            if (
                response
                and "episode" in response
                and "release_date" in response["episode"]
            ):
                self.first_release_date = response["episode"]["release_date"]

    def fetch_best_magnet_for_current_episode(self):
        search_engine = "https://limetorrents.lol"
        search_prefixes = ["2160p", "1080p", "720p"]

        current_episode = self.fetch_current_episode()

        if not current_episode:
            return None

        episode_search = (
            f"S{self.current_season:02d}E{self.current_episode:02d}"
            if self.episode_lookup_type != "date"
            else current_episode["release_date"]
        )

        for prefix in search_prefixes:
            search_term = (
                f"{prefix}-{self.full_name.replace(' ', '-')}-{episode_search}"
            )
            url = f"{search_engine}/search/all/{search_term}/seeds/1"
            content = self.get_content(url)

            soup = BeautifulSoup(content, "lxml")

            tables = soup.find_all("table")
            if len(tables) < 2:
                continue

            table = tables[1]
            seeds, magnets = self.extract_seeds_and_magnets(table, search_engine)
            best_magnet = self.get_best_magnet(seeds, magnets, search_term)

            if best_magnet:
                return best_magnet

        return None

    def get_content(self, url):
        with requests.Session() as s:
            return s.get(url, verify=True).text

    def extract_seeds_and_magnets(self, table, search_engine):
        seeds, magnets = [], []
        for row in table.find_all("tr", {"bgcolor": re.compile("#F4F4F4|#FFFFFF")})[:5]:
            seeds.append(int(row.find("td", {"class": "tdseed"}).text.replace(",", "")))
            page_lookup_url = row.find_all("a")[1]["href"]
            magnets.append(self.fetch_magnet_link_lime(search_engine + page_lookup_url))
        return seeds, magnets

    def fetch_magnet_link_lime(self, url):
        content = self.get_content(url)
        soup = BeautifulSoup(content, "lxml")
        for link in soup.find_all("a"):
            if "magnet:" in link["href"]:
                return link["href"]
        return None

    def get_best_magnet(self, seeds, magnets, search_term):
        max_seeds, best_magnet = 0, None
        for seed, magnet in zip(seeds, magnets):
            if not magnet:
                continue
            if seed > max_seeds and any(
                res in magnet for res in ["4k", "2160p", "1080p", "720p"]
            ):
                max_seeds, best_magnet = seed, magnet
        return best_magnet

    def current_episode_released(self):
        try:
            response = epguides_api_request(f"show/{self.key_season_episode}/released/")
            return response.get("status") if response else False
        except EpguidesException:
            return False

    def download_current_episode(self):
        if not self.current_episode_released() or self.downloaded_current_episode:
            return False

        magnet = self.fetch_best_magnet_for_current_episode()

        if not magnet:
            log.info(
                f"Will skip {self.full_name}, can't find magnet for current episode: {self.current_season}:{self.current_episode}"
            )
            return False

        log.info(
            f"Downloading {self.full_name}, episode: {self.current_season}:{self.current_episode}"
        )
        download_dir = get_tv_folder(self.keep)
        return TXWrapper.add(magnet, download_dir=download_dir)

    def get_next_episode(self):
        try:
            response = epguides_api_request(f"show/{self.epguide_name}/next/")
            return response.get("episode") if response else None
        except EpguidesException:
            return None

    def is_next_episode_released(self):
        try:
            return epguides_api_request(
                f"show/{self.key_season_episode}/next/released/"
            )
        except EpguidesException:
            return False

    def download_all_available_episodes_starting_at_current_episode(self):
        self.update_last_next_and_first_episodes_data()

        if not self.active:
            log.info(f"Skipping {self.full_name}, marked as inactive")
            return

        if not self.current_episode_released():
            log.info(f"Skipping {self.full_name}, current episode not released")
            return

        if not self.downloaded_current_episode and self.download_current_episode():
            self.downloaded_current_episode = True
            self.save()

        if self.downloaded_current_episode and self.is_next_episode_released():
            next_episode = self.get_next_episode()
            if next_episode:
                self.current_season = next_episode["season"]
                self.current_episode = next_episode["number"]
                self.downloaded_current_episode = False
                self.save()
                self.download_all_available_episodes_starting_at_current_episode()

    def get_status(self):
        if self.next_release_date <= datetime.date.today():
            return "Expired", "gray"
        elif self.downloaded_current_episode:
            return "Up to date", "green"
        elif self.current_season == self.last_release_season and (
            self.current_episode == self.last_release_episode + 1
            or self.current_episode == self.last_release_episode
        ):
            return "Up to date", "green"
        elif (
            self.current_season == self.last_release_season + 1
            and self.current_episode == 1
        ):
            return "Up to date", "green"
        else:
            return "Behind", "red"
