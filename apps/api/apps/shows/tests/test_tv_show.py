from datetime import date, timedelta
from unittest.mock import Mock, patch

import pytest
from django.test import TestCase
from django.utils import timezone

from media.models import TVShow
from media.schemas import ShowStatus, StatusColor
from core.exceptions import EpguidesException


@pytest.fixture
def mock_epguides_response():
    """Create a mock epguides API response."""
    return {
        "status": True,
        "episode": {
            "season": 1,
            "number": 1,
            "release_date": "2024-01-01",
            "title": "Pilot"
        }
    }


@pytest.fixture
def sample_show():
    """Create a sample TV show for testing."""
    return TVShow.objects.create(
        epguide_name="test_show",
        full_name="Test Show",
        current_season=1,
        current_episode=1,
        active=True
    )


class TestTVShow(TestCase):
    """Test suite for TVShow model."""

    def setUp(self):
        """Set up test data."""
        self.show = TVShow.objects.create(
            epguide_name="test_show",
            full_name="Test Show",
            current_season=1,
            current_episode=1,
            active=True
        )

    def test_str_representation(self):
        """Test string representation of TVShow."""
        self.assertEqual(str(self.show), "test_show Test Show")

    def test_key_season_episode(self):
        """Test key_season_episode property."""
        self.assertEqual(self.show.key_season_episode, "test_show/1/1")

    @patch("media.models.epguides_api_request")
    def test_fetch_current_episode_success(self, mock_request):
        """Test fetching current episode successfully."""
        expected = {"season": 1, "number": 1}
        mock_request.return_value = {"episode": expected}
        
        result = self.show.fetch_current_episode()
        
        self.assertEqual(result, expected)
        mock_request.assert_called_once_with("show/test_show/1/1")

    @patch("media.models.epguides_api_request")
    def test_fetch_current_episode_failure(self, mock_request):
        """Test fetching current episode with API failure."""
        mock_request.return_value = None
        
        result = self.show.fetch_current_episode()
        
        self.assertIsNone(result)

    @patch("media.models.epguides_api_request")
    def test_update_last_episode_data(self, mock_request):
        """Test updating last episode data."""
        mock_request.return_value = {
            "episode": {
                "release_date": "2024-01-01",
                "season": 2,
                "number": 10
            }
        }
        
        self.show.update_last_episode_data()
        
        self.assertEqual(self.show.last_release_date, date(2024, 1, 1))
        self.assertEqual(self.show.last_release_season, 2)
        self.assertEqual(self.show.last_release_episode, 10)

    def test_get_status_finished(self):
        """Test show status when finished."""
        past_date = date.today() - timedelta(days=1)
        self.show.next_release_date = past_date
        self.show.last_release_date = past_date
        
        status, color = self.show.get_status()
        
        self.assertEqual(status, ShowStatus.FINISHED)
        self.assertEqual(color, StatusColor.GRAY)

    def test_get_status_up_to_date(self):
        """Test show status when up to date."""
        future_date = date.today() + timedelta(days=1)
        self.show.next_release_date = future_date
        self.show.last_release_season = 1
        self.show.current_season = 2
        
        status, color = self.show.get_status()
        
        self.assertEqual(status, ShowStatus.UP_TO_DATE)
        self.assertEqual(color, StatusColor.GREEN)

    def test_get_status_behind(self):
        """Test show status when behind."""
        self.show.last_release_season = 2
        self.show.current_season = 1
        
        status, color = self.show.get_status()
        
        self.assertEqual(status, ShowStatus.BEHIND)
        self.assertEqual(color, StatusColor.RED)

    @patch("media.models.epguides_api_request")
    def test_current_episode_released_true(self, mock_request):
        """Test checking if current episode is released."""
        mock_request.return_value = {"status": True}
        
        self.assertTrue(self.show.current_episode_released())
        mock_request.assert_called_once_with("show/test_show/1/1/released/")

    @patch("media.models.epguides_api_request")
    def test_current_episode_released_api_error(self, mock_request):
        """Test handling API error when checking episode release."""
        mock_request.side_effect = EpguidesException("API Error")
        
        self.assertFalse(self.show.current_episode_released())

    @patch("media.models.TXWrapper")
    @patch("media.models.get_tv_folder")
    def test_download_current_episode_success(self, mock_get_folder, mock_tx):
        """Test downloading current episode successfully."""
        # Setup
        mock_get_folder.return_value = "/data/tv"
        mock_tx.add.return_value = True
        
        with patch.object(TVShow, "current_episode_released", return_value=True), \
             patch.object(TVShow, "fetch_best_magnet_for_current_episode", 
                        return_value="magnet:test"):
            
            result = self.show.download_current_episode()
            
            self.assertTrue(result)
            mock_tx.add.assert_called_once_with("magnet:test", download_dir="/data/tv")

    def test_download_current_episode_already_downloaded(self):
        """Test skipping download for already downloaded episode."""
        self.show.downloaded_current_episode = True
        
        result = self.show.download_current_episode()
        
        self.assertFalse(result)

    @patch("media.models.requests.Session")
    def test_fetch_best_magnet_quality_preference(self, mock_session):
        """Test magnet selection with quality preference."""
        mock_response = Mock()
        mock_response.text = """
            <table>
                <tr bgcolor="#F4F4F4">
                    <td class="tdseed">100</td>
                    <a href="/test1">2160p</a>
                </tr>
                <tr bgcolor="#FFFFFF">
                    <td class="tdseed">200</td>
                    <a href="/test2">1080p</a>
                </tr>
            </table>
        """
        mock_session.return_value.__enter__.return_value.get.return_value = mock_response
        
        with patch.object(TVShow, "fetch_magnet_link_lime") as mock_fetch:
            mock_fetch.side_effect = ["magnet:2160p", "magnet:1080p"]
            
            magnet = self.show.fetch_best_magnet_for_current_episode()
            
            self.assertEqual(magnet, "magnet:1080p")

    @patch("media.models.epguides_api_request")
    def test_download_all_available_episodes(self, mock_request):
        """Test downloading all available episodes."""
        # Setup mock responses
        mock_request.side_effect = [
            {"episode": {"season": 1, "number": 1}},  # Current episode
            {"status": True},  # Current episode released
            {"status": True},  # Next episode released
            {"episode": {"season": 1, "number": 2}}  # Next episode
        ]
        
        with patch.object(TVShow, "download_current_episode", return_value=True):
            self.show.download_all_available_episodes_starting_at_current_episode()
            
            self.assertEqual(self.show.current_season, 1)
            self.assertEqual(self.show.current_episode, 2)
            self.assertFalse(self.show.downloaded_current_episode)

    def test_inactive_show_skipped(self):
        """Test that inactive shows are skipped."""
        self.show.active = False
        self.show.save()
        
        with patch.object(TVShow, "download_current_episode") as mock_download:
            self.show.download_all_available_episodes_starting_at_current_episode()
            
            mock_download.assert_not_called() 