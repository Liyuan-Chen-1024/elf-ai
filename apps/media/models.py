import os
from django.db import models 
from django.utils import timezone

import logging
from django.conf import settings
from apps.media.utils.exceptions import EpisodeNotFoundException, ShowNotFoundException
from apps.media.utils.fetcher import potato_api_request, epguides_api_request
from apps.media.utils.files import get_tv_folder
from apps.media.utils.tx import TXWrapper
import random
import time
LOGGING_CONF = os.path.join(settings.BASE_DIR, "logging.ini")
logging.config.fileConfig(LOGGING_CONF)
log = logging.getLogger("jarvis_fetcher")

class MediaFile(models.Model):
    path = models.TextField()
    dirname = models.TextField(null=True, blank=True)
    ext = models.CharField(null=True, blank=True, max_length=20)
    st_mode = models.BigIntegerField(null=True, blank=True)
    st_uid=models.BigIntegerField(null=True, blank=True)
    st_gid=models.BigIntegerField(null=True, blank=True)
    st_size=models.BigIntegerField(null=True, blank=True)
    st_atime=models.BigIntegerField(null=True, blank=True)
    st_mtime=models.BigIntegerField(null=True, blank=True)
    st_ctime=models.BigIntegerField(null=True, blank=True)
    last_read_from_disk = models.BigIntegerField(null=True, blank=True)
    keep = models.BooleanField(default=False)
    is_movie = models.BooleanField(default=False)
    
    @staticmethod
    def create_or_update_from_path(path):
        media_file = MediaFile.objects.get_or_create(path=path)[0]
        if media_file.exists_on_disk():
            stats = os.stat(path)

            if stats.st_mtime and media_file.last_read_from_disk:
                if media_file.last_read_from_disk > stats.st_mtime:
                    return

            media_file.st_ctime = stats.st_ctime
            media_file.st_mtime = stats.st_mtime
            media_file.st_atime = stats.st_atime
            media_file.st_size = stats.st_size
            media_file.st_gid = stats.st_gid
            media_file.st_uid = stats.st_uid
            media_file.st_mode = stats.st_mode
            media_file.dirname = os.path.dirname(path)
            media_file.last_read_from_disk = time.time()
            media_file.ext = os.path.splitext(path)[1]
            if '/keep/' in path:
                media_file.keep = True
            if '/movies/' in path:
                media_file.is_movie = True
            else:
                media_file.is_movie = False
            media_file.save()
        else:
            media_file.delete()

    def __str__(self):
      return "{0}".format(self.path)

    def exists_on_disk(self):
        return os.path.exists(self.path)

    def remove_from_disk(self):
        os.remove(self.path)
        self.delete()

# Create your models here.
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
      return "{0} {1}".format(self.epguide_name, self.full_name)

    @property
    def key_season_episode(self):
        return '{0}/{1}/{2}'.format(
            self.full_name,
            self.current_season,
            self.current_episode
        )

    def fetch_current_episode(self):
        return epguides_api_request(
            'show/{0}'.format(self.key_season_episode)
        )['episode']

    def update_last_next_and_first_episodes_data(self):
        last_episode = epguides_api_request("show/{0}/last/".format(self.epguide_name))['episode']
        self.last_release_date = last_episode['release_date']
        self.last_release_season = last_episode['season']
        self.last_release_episode = last_episode['number']

        next_episode = self.get_next_episode()

        if next_episode:
            self.next_release_date = next_episode['release_date']
    
        if not self.first_release_date:
            self.first_release_date = epguides_api_request(
                "show/{0}/first/".format(self.epguide_name)
            )['episode']['release_date']
        
        self.save()

    def fetch_best_magnet_for_current_episode(self):
        if self.episode_lookup_type == 'date':
            date = " ".join(self.fetch_current_episode()['release_date'].split("-"))
            magnets = potato_api_request('show/{0}/free/{1}'.format(self.full_name, date))
        else:
            magnets = potato_api_request('show/{0}/{1}/{2}/'.format(
                self.full_name,
                self.current_season,
                self.current_episode
            ))

        if not magnets:
            return None
    
        if '2160p' in magnets and magnets['2160p']:
            return magnets['2160p']
        if "1080p" in magnets and magnets["1080p"]:
            return magnets["1080p"]
        if "720p" in magnets and magnets["720p"]:
            return magnets["720p"]

        return None

    def current_episode_released(self):
        return epguides_api_request(
            'show/{0}/released/'.format(self.key_season_episode)
        )['status']
    
    def download_current_episode(self):
        if not self.current_episode_released():
            pass
        if self.downloaded_current_episode:
            pass
        
        magnet = self.fetch_best_magnet_for_current_episode()
        if not magnet:
            return False
        
        download_dir = get_tv_folder(self.keep)

        return TXWrapper.add(
            magnet,
            download_dir=download_dir
        )
        
    
    def get_next_episode(self):
        try:
            return epguides_api_request(
                'show/{0}/next/'.format(self.key_season_episode)
            )['episode']
        except EpisodeNotFoundException:
            pass
        
        return None
    
    def is_next_episode_released(self):
        try:
            return epguides_api_request(
                'show/{0}/next/released/'.format(self.key_season_episode)
            )
        except EpisodeNotFoundException:
            pass
        return False

    def download_all_available_episodes_starting_at_current_episode(self):
        if bool(random.getrandbits(1)):
            self.update_last_next_and_first_episodes_data()
        
        if not self.active:
            log.info("Skipping {0}, marked as inactive".format(self.full_name))

        if not self.downloaded_current_episode:
            if self.download_current_episode():
                self.downloaded_current_episode = True
                self.save()
            else:
                return

        if self.downloaded_current_episode and self.is_next_episode_released():
            next_episode = self.get_next_episode()
            self.current_season = next_episode['season']
            self.current_episode = next_episode['number']
            self.downloaded_current_episode = False
            self.save()
            self.download_all_available_episodes_starting_at_current_episode()
