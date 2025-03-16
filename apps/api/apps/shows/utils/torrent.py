"""Torrent client utilities."""
from pathlib import Path
from typing import List, Optional, Union

from transmission_rpc import Client
from transmission_rpc.torrent import Torrent

from apps.shows.typing import DownloadStatus
from apps.core.config import settings
from apps.core.logging import get_logger

logger = get_logger(__name__)


class TorrentClient:
    """Wrapper for transmission-rpc client with enhanced functionality."""
    
    def __init__(self):
        """Initialize the torrent client."""
        self.client = Client(
            host=settings.TRANSMISSION_HOST,
            port=settings.TRANSMISSION_PORT,
            username=settings.TRANSMISSION_USERNAME,
            password=settings.TRANSMISSION_PASSWORD,
        )
        
    def add_torrent(self, magnet_url: str, download_dir: Union[str, Path]) -> bool:
        """Add a new torrent to the client.
        
        Args:
            magnet_url: Magnet URL to add
            download_dir: Directory to download files to
            
        Returns:
            True if torrent was added successfully, False otherwise
        """
        try:
            self.client.add_torrent(
                magnet_url,
                download_dir=str(download_dir),
            )
            return True
        except Exception as e:
            logger.error(f"Error adding torrent: {str(e)}")
            return False
            
    def remove_torrent(self, torrent_id: int, delete_data: bool = False) -> bool:
        """Remove a torrent from the client.
        
        Args:
            torrent_id: ID of the torrent to remove
            delete_data: Whether to delete downloaded data
            
        Returns:
            True if torrent was removed successfully, False otherwise
        """
        try:
            self.client.remove_torrent(torrent_id, delete_data=delete_data)
            return True
        except Exception as e:
            logger.error(f"Error removing torrent {torrent_id}: {str(e)}")
            return False
            
    def get_torrent_status(self, torrent_id: int) -> Optional[DownloadStatus]:
        """Get the status of a torrent.
        
        Args:
            torrent_id: ID of the torrent to check
            
        Returns:
            Torrent status if found, None otherwise
        """
        try:
            torrent = self.client.get_torrent(torrent_id)
            return self._map_status(torrent)
        except Exception as e:
            logger.error(f"Error getting torrent {torrent_id} status: {str(e)}")
            return None
            
    def _map_status(self, torrent: Torrent) -> DownloadStatus:
        """Map transmission status to our status enum."""
        if torrent.status == "downloading":
            return "downloading"
        elif torrent.status == "seeding":
            return "seeding"
        elif torrent.status in ["stopped", "finished"]:
            return "stopped"
        else:
            return "error"
            
    def get_active_torrents(self) -> List[Torrent]:
        """Get all active torrents.
        
        Returns:
            List of active torrents
        """
        try:
            return [
                t for t in self.client.get_torrents()
                if t.status in ["downloading", "seeding"]
            ]
        except Exception as e:
            logger.error(f"Error getting active torrents: {str(e)}")
            return []
            
    def stop_torrent(self, torrent_id: int) -> bool:
        """Stop a torrent.
        
        Args:
            torrent_id: ID of the torrent to stop
            
        Returns:
            True if torrent was stopped successfully, False otherwise
        """
        try:
            self.client.stop_torrent(torrent_id)
            return True
        except Exception as e:
            logger.error(f"Error stopping torrent {torrent_id}: {str(e)}")
            return False
            
    def start_torrent(self, torrent_id: int) -> bool:
        """Start a torrent.
        
        Args:
            torrent_id: ID of the torrent to start
            
        Returns:
            True if torrent was started successfully, False otherwise
        """
        try:
            self.client.start_torrent(torrent_id)
            return True
        except Exception as e:
            logger.error(f"Error starting torrent {torrent_id}: {str(e)}")
            return False 