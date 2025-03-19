from dataclasses import dataclass
from typing import Optional, cast

from django.conf import settings

from transmission_rpc import Client, Torrent
from transmission_rpc.error import TransmissionError

from ..enums import TorrentStatus
from ..typing import QueueResult, QueueStats, TorrentId, TorrentInfo


@dataclass
class TorrentConfig:
    """Configuration for torrent management."""

    min_download_rate: int = 150  # Minimum acceptable download rate in KB/s
    rate_ratio_threshold: float = 0.5  # Threshold ratio compared to average rate


class TXWrapper:
    """
    Wrapper for transmission-rpc client providing high-level torrent management functionality.

    This class provides methods to:
    - Add new torrents to the queue
    - Monitor download progress
    - Manage the download queue (remove completed, retry failed, etc.)
    - Track download statistics
    """

    config: TorrentConfig = TorrentConfig()

    @classmethod
    def get_client(cls) -> Client:
        """Get a configured transmission client instance.

        Returns:
            Configured transmission client

        Raises:
            TransmissionError: If connection fails
        """
        try:
            return Client(
                host=settings.TRANSMISSION_HOST,
                port=settings.TRANSMISSION_PORT,
                username=settings.TRANSMISSION_USER,
                password=settings.TRANSMISSION_PASSWORD,
            )
        except Exception as e:
            raise TransmissionError(f"Failed to connect to transmission: {str(e)}")

    @classmethod
    def add(cls, url: str, download_dir: Optional[str] = None) -> bool:
        """Add a new torrent to the queue.

        Args:
            url: Magnet URL or torrent file URL
            download_dir: Directory to save downloaded files

        Returns:
            True if torrent was added successfully

        Raises:
            TransmissionError: If adding the torrent fails
        """
        try:
            client = cls.get_client()
            torrent = client.add_torrent(
                torrent=url,
                download_dir=download_dir or settings.TRANSMISSION_DOWNLOAD_DIR,
            )
            return bool(torrent)
        except Exception as e:
            raise TransmissionError(f"Failed to add torrent: {str(e)}")

    @classmethod
    def get_queue_status(cls) -> QueueStats:
        """Get current queue statistics.

        Returns:
            QueueStats containing counts of active, completed, failed, and total torrents

        Raises:
            TransmissionError: If fetching queue status fails
        """
        try:
            client = cls.get_client()
            torrents = client.get_torrents()

            stats: QueueStats = {
                "active": 0,
                "completed": 0,
                "failed": 0,
                "total": len(torrents),
            }

            for torrent in torrents:
                if torrent.status == TorrentStatus.SEEDING.value or torrent.is_finished:
                    stats["completed"] += 1
                elif torrent.status == TorrentStatus.DOWNLOADING.value:
                    stats["active"] += 1
                elif torrent.status == TorrentStatus.STOPPED.value or torrent.error:
                    stats["failed"] += 1

            return stats
        except Exception as e:
            raise TransmissionError(f"Failed to get queue status: {str(e)}")

    @classmethod
    def manage_queue(
        cls,
        remove_completed: bool = False,
        remove_failed: bool = False,
        retry_failed: bool = False,
    ) -> QueueResult:
        """Manage the transmission queue.

        Args:
            remove_completed: Whether to remove completed torrents
            remove_failed: Whether to remove failed torrents
            retry_failed: Whether to retry failed torrents

        Returns:
            QueueResult containing operation statistics

        Raises:
            TransmissionError: If queue management operations fail
        """
        try:
            client = cls.get_client()
            torrents = client.get_torrents(
                arguments=[
                    "id",
                    "status",
                    "isFinished",
                    "name",
                    "rateDownload",
                    "error",
                ]
            )

            stats: QueueResult = {
                "processed": len(torrents),
                "removed": 0,
                "retried": 0,
                "errors": 0,
            }

            def is_finished(torrent: Torrent) -> bool:
                """Check if a torrent is finished."""
                return torrent.status == TorrentStatus.SEEDING.value or cast(
                    bool, torrent.is_finished
                )

            def is_failed(torrent: Torrent) -> bool:
                """Check if a torrent has failed."""
                return torrent.status == TorrentStatus.STOPPED.value or bool(
                    torrent.error
                )

            def is_slow(torrent: Torrent) -> bool:
                """Check if a torrent's download speed is too slow."""
                if not torrent.rate_download:
                    return True

                active_rates = [
                    t.rate_download
                    for t in torrents
                    if t.status == TorrentStatus.DOWNLOADING.value
                    and t.rate_download > 0
                ]

                if not active_rates:
                    return False

                avg_rate = sum(active_rates) / len(active_rates)
                return (
                    torrent.rate_download < cls.config.min_download_rate
                    or torrent.rate_download
                    < (avg_rate * cls.config.rate_ratio_threshold)
                )

            # Handle completed torrents
            if remove_completed:
                completed_ids = [t.id for t in torrents if is_finished(t)]
                if completed_ids:
                    client.remove_torrent(ids=completed_ids)
                    stats["removed"] += len(completed_ids)

            # Handle failed torrents
            failed = [t for t in torrents if is_failed(t)]
            if failed:
                failed_ids = [t.id for t in failed]
                if remove_failed:
                    client.remove_torrent(ids=failed_ids)
                    stats["removed"] += len(failed)
                elif retry_failed:
                    client.start_torrent(ids=failed_ids)
                    stats["retried"] += len(failed)

            # Handle slow torrents
            downloading = [
                t for t in torrents if t.status == TorrentStatus.DOWNLOADING.value
            ]
            slow_ids = [t.id for t in downloading if is_slow(t)]
            if slow_ids:
                client.stop_torrent(ids=slow_ids)

            # Resume paused torrents that aren't failed or slow
            paused_ids = [
                t.id
                for t in torrents
                if t.status == TorrentStatus.STOPPED.value
                and not is_failed(t)
                and not any(s == t.id for s in slow_ids)
            ]
            if paused_ids:
                client.start_torrent(ids=paused_ids)

            return stats

        except Exception as e:
            raise TransmissionError(f"Failed to manage queue: {str(e)}")

    @classmethod
    def get_torrent_info(cls, torrent_id: TorrentId) -> Optional[TorrentInfo]:
        """Get information about a specific torrent.

        Args:
            torrent_id: ID of the torrent to get info for

        Returns:
            TorrentInfo if found, None otherwise

        Raises:
            TransmissionError: If fetching torrent info fails
        """
        try:
            client = cls.get_client()
            torrent = client.get_torrent(torrent_id)
            return {
                "id": cast(int, torrent.id),
                "name": cast(str, torrent.name),
                "status": TorrentStatus(torrent.status),
                "progress": cast(float, torrent.progress),
                "download_dir": cast(str, torrent.download_dir),
                "rate_download": cast(int, torrent.rate_download),
                "error": cast(str, torrent.error or ""),
            }
        except Exception as e:
            raise TransmissionError(f"Failed to get torrent info: {str(e)}")

    @classmethod
    def remove_torrent(cls, torrent_id: TorrentId, delete_data: bool = False) -> bool:
        """Remove a torrent from the queue.

        Args:
            torrent_id: ID of the torrent to remove
            delete_data: Whether to also delete downloaded data

        Returns:
            True if torrent was removed successfully

        Raises:
            TransmissionError: If removing the torrent fails
        """
        try:
            client = cls.get_client()
            client.remove_torrent(ids=torrent_id, delete_data=delete_data)
            return True
        except Exception as e:
            raise TransmissionError(f"Failed to remove torrent: {str(e)}")

    @classmethod
    def start_torrent(cls, torrent_id: TorrentId) -> bool:
        """Start a torrent.

        Args:
            torrent_id: ID of the torrent to start

        Returns:
            True if torrent was started successfully

        Raises:
            TransmissionError: If starting the torrent fails
        """
        try:
            client = cls.get_client()
            client.start_torrent(ids=torrent_id)
            return True
        except Exception as e:
            raise TransmissionError(f"Failed to start torrent: {str(e)}")

    @classmethod
    def stop_torrent(cls, torrent_id: TorrentId) -> bool:
        """Stop a torrent.

        Args:
            torrent_id: ID of the torrent to stop

        Returns:
            True if torrent was stopped successfully

        Raises:
            TransmissionError: If stopping the torrent fails
        """
        try:
            client = cls.get_client()
            client.stop_torrent(ids=torrent_id)
            return True
        except Exception as e:
            raise TransmissionError(f"Failed to stop torrent: {str(e)}")
