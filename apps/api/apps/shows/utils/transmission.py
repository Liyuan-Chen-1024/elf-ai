"""Transmission torrent client wrapper."""
from typing import Dict, List, Optional, Union
import transmissionrpc

from apps.core.config import settings
from apps.core.logging import get_logger
from apps.shows.typing import TorrentInfo, TorrentId, TorrentIds, TorrentStatus

logger = get_logger(__name__)


class TXWrapper:
    """Wrapper for transmission torrent client."""
    
    def __init__(self, host: str = 'localhost', port: int = 9091):
        """Initialize wrapper.
        
        Args:
            host: Transmission host
            port: Transmission port
        """
        self.host = host
        self.port = port
        self._client = None
        
    @property
    def client(self) -> transmissionrpc.Client:
        """Get transmission client.
        
        Returns:
            Transmission client instance
        """
        if self._client is None:
            try:
                self._client = transmissionrpc.Client(
                    address=self.host,
                    port=self.port
                )
            except Exception as e:
                logger.error(f"Failed to connect to transmission: {str(e)}")
                raise
        return self._client
        
    def add_torrent(self, magnet_url: str, download_dir: str) -> Optional[int]:
        """Add a torrent to transmission.
        
        Args:
            magnet_url: Magnet URL
            download_dir: Download directory
            
        Returns:
            Torrent ID if successful, None otherwise
        """
        try:
            torrent = self.client.add_torrent(
                magnet_url,
                download_dir=download_dir
            )
            return torrent.id
        except Exception as e:
            logger.error(f"Failed to add torrent: {str(e)}")
            return None
            
    def get_torrent(self, torrent_id: TorrentId) -> Optional[TorrentInfo]:
        """Get torrent information.
        
        Args:
            torrent_id: Torrent ID
            
        Returns:
            Torrent information if found, None otherwise
        """
        try:
            torrent = self.client.get_torrent(torrent_id)
            return TorrentInfo(
                id=torrent.id,
                name=torrent.name,
                status=self._get_status(torrent.status),
                progress=torrent.progress,
                download_dir=torrent.download_dir,
                rate_download=torrent.rate_download,
                error=torrent.error_string
            )
        except Exception as e:
            logger.error(f"Failed to get torrent {torrent_id}: {str(e)}")
            return None
            
    def remove_torrent(self, torrent_id: TorrentId, delete_data: bool = False) -> bool:
        """Remove a torrent.
        
        Args:
            torrent_id: Torrent ID
            delete_data: Whether to delete downloaded data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.remove_torrent(torrent_id, delete_data=delete_data)
            return True
        except Exception as e:
            logger.error(f"Failed to remove torrent {torrent_id}: {str(e)}")
            return False
            
    def _get_status(self, status: str) -> TorrentStatus:
        """Convert transmission status to internal status.
        
        Args:
            status: Transmission status
            
        Returns:
            Internal status
        """
        status_map = {
            'downloading': 'downloading',
            'seeding': 'seeding',
            'stopped': 'stopped'
        }
        return status_map.get(status, 'error') 