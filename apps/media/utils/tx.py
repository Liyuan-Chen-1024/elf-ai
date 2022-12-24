import random
import datetime
from transmission_rpc import Client
from django.conf import settings

class TXWrapper:

    @classmethod
    def add(cls, url, download_dir='/data'):
        client = Client(host=settings.TX_HOST)
        return client.add_torrent(torrent=url, download_dir=download_dir)

    @classmethod
    def manage_queue(cls):
        client = Client(host=settings.TX_HOST)
        torrents = client.get_torrents(
            arguments=[
                'id',
                'activityDate',
                'addedDate',
                'isFinished',
                'name',
                'rateDownload',
                'status',
                'secondsDownloading'
            ]
        )

        def is_finished(torrent):
            return torrent.status == 'seeding' or torrent.isFinished

        def is_downloading(torrent):
            return torrent.status == 'downloading'

        def is_paused(torrent):
            return torrent.status == 'stopped'

        def is_slow(torrent):
            downloadRates = map(lambda x: x.rateDownload, torrents)
            downloadRates = list(filter(lambda x: x > 1, downloadRates))
            if len(downloadRates) > 0:
                avg_download_rate = sum(downloadRates) / float(len(downloadRates))
                avg_download_rate = avg_download_rate / 1024
            else:
                avg_download_rate = 0
            return torrent.rateDownload < 150 and torrent.rateDownload <= (avg_download_rate / 2)

        def remove_finished_torrents():
            ids = list(map(lambda x: x.id, filter(is_finished, torrents)))
            if len(ids) > 0:
                client.remove_torrent(ids=ids)

        def pause_slow_torrents():
            torrents_downloading = filter(is_downloading, torrents)
            slow_torrents = filter(is_slow, torrents_downloading)
            ids = list(map(lambda x: x.id, slow_torrents))
            if len(ids) > 0:
                client.stop_torrent(ids=ids)

        def resume_torrents():
            torrents_paused = filter(is_paused, torrents)
            ids = list(map(lambda x: x.id, torrents_paused))
            if len(ids) > 0:
                client.start_torrent(ids=ids)

        remove_finished_torrents()
        resume_torrents()
        pause_slow_torrents()
