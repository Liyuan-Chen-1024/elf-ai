"""Tests for the transmission wrapper."""
from unittest.mock import MagicMock, patch

import pytest
from django.test import TestCase
from transmission_rpc import Client
from transmission_rpc.error import TransmissionError

from apps.shows.utils.tx import TXWrapper


@pytest.fixture
def mock_client():
    """Create a mock transmission client."""
    with patch("apps.shows.utils.tx.Client") as mock:
        yield mock


@pytest.fixture
def mock_torrent():
    """Create a mock torrent object."""
    torrent = MagicMock()
    torrent.id = 1
    torrent.name = "Test Show S01E01"
    torrent.status = "downloading"
    torrent.isFinished = False
    torrent.error = None
    torrent.rateDownload = 1000
    return torrent


class TestTXWrapper(TestCase):
    """Test cases for the transmission wrapper."""

    def setUp(self):
        """Set up test environment."""
        with patch("apps.shows.utils.tx.Client") as mock:
            self.mock_client = mock.return_value
            self.wrapper = TXWrapper()

    def test_add_torrent_success(self, mock_client):
        """Test adding a torrent successfully."""
        mock_client.add_torrent.return_value = True
        
        result = TXWrapper.add("magnet:test", "/data/test")
        
        assert result is True
        mock_client.assert_called_once_with(host="localhost")
        mock_client.return_value.add_torrent.assert_called_once_with(
            torrent="magnet:test",
            download_dir="/data/test"
        )

    def test_add_torrent_failure(self, mock_client):
        """Test adding a torrent that fails."""
        mock_client.add_torrent.return_value = False
        
        result = TXWrapper.add("magnet:test", "/data/test")
        
        assert result is False

    def test_add_torrent_error(self, mock_client):
        """Test adding a torrent that raises an error."""
        mock_client.add_torrent.side_effect = TransmissionError("Test error")
        
        with pytest.raises(TransmissionError, match="Test error"):
            TXWrapper.add("magnet:test", "/data/test")

    def test_get_queue_status_empty(self, mock_client):
        """Test getting queue status with no torrents."""
        mock_client.get_torrents.return_value = []
        
        status = TXWrapper.get_queue_status()
        
        assert status == {
            "active": 0,
            "completed": 0,
            "failed": 0,
            "total": 0
        }

    def test_get_queue_status_with_torrents(self, mock_client, mock_torrent):
        """Test getting queue status with various torrent states."""
        # Create torrents in different states
        downloading = MagicMock(**{"status": "downloading", "isFinished": False})
        seeding = MagicMock(**{"status": "seeding", "isFinished": True})
        failed = MagicMock(**{"status": "stopped", "error": "Test error"})
        
        mock_client.get_torrents.return_value = [
            downloading, seeding, failed
        ]
        
        status = TXWrapper.get_queue_status()
        
        assert status == {
            "active": 1,
            "completed": 1,
            "failed": 1,
            "total": 3
        }

    def test_manage_queue_remove_completed(self, mock_client):
        """Test managing queue with completed torrents removal."""
        # Setup torrents
        completed = MagicMock(**{
            "id": 1,
            "status": "seeding",
            "isFinished": True,
            "rateDownload": 0
        })
        active = MagicMock(**{
            "id": 2,
            "status": "downloading",
            "isFinished": False,
            "rateDownload": 1000
        })
        
        mock_client.get_torrents.return_value = [completed, active]
        
        result = TXWrapper.manage_queue(remove_completed=True)
        
        assert result["removed"] == 1
        mock_client.return_value.remove_torrent.assert_called_once_with(ids=[1])

    def test_manage_queue_retry_failed(self, mock_client):
        """Test managing queue with failed torrents retry."""
        # Setup torrents
        failed = MagicMock(**{
            "id": 1,
            "status": "stopped",
            "error": "Test error",
            "rateDownload": 0
        })
        active = MagicMock(**{
            "id": 2,
            "status": "downloading",
            "isFinished": False,
            "rateDownload": 1000
        })
        
        mock_client.get_torrents.return_value = [failed, active]
        
        result = TXWrapper.manage_queue(retry_failed=True)
        
        assert result["retried"] == 1
        mock_client.return_value.start_torrent.assert_called_once_with(ids=[1])

    def test_manage_queue_handle_slow_torrents(self, mock_client):
        """Test managing queue with slow torrents."""
        # Setup torrents
        slow = MagicMock(**{
            "id": 1,
            "status": "downloading",
            "isFinished": False,
            "rateDownload": 100  # Below threshold
        })
        fast = MagicMock(**{
            "id": 2,
            "status": "downloading",
            "isFinished": False,
            "rateDownload": 1000
        })
        
        mock_client.get_torrents.return_value = [slow, fast]
        
        TXWrapper.manage_queue()
        
        # Verify slow torrent was stopped
        mock_client.return_value.stop_torrent.assert_called_once_with(ids=[1])

    def test_manage_queue_error_handling(self, mock_client):
        """Test error handling in manage_queue."""
        mock_client.get_torrents.side_effect = TransmissionError("Test error")
        
        with pytest.raises(Exception, match="Failed to manage queue: Test error"):
            TXWrapper.manage_queue()

    @patch("django.conf.settings.TX_HOST", "test-host")
    def test_custom_transmission_host(self, mock_client):
        """Test using a custom transmission host from settings."""
        TXWrapper.add("magnet:test")
        
        mock_client.assert_called_once_with(host="test-host") 