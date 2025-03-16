import os
import time
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

from django.test import TestCase

import pytest

from apps.shows.models import MediaFile


@pytest.fixture
def temp_media_file(tmp_path):
    """Create a temporary media file for testing."""
    file_path = tmp_path / "test.mp4"
    file_path.write_text("test content")
    return str(file_path)


@pytest.fixture
def mock_stat():
    """Create a mock stat result."""
    stat = Mock()
    stat.st_mode = 33188  # Regular file
    stat.st_uid = 1000
    stat.st_gid = 1000
    stat.st_size = 1024
    stat.st_atime = time.time()
    stat.st_mtime = time.time()
    stat.st_ctime = time.time()
    return stat


class TestMediaFile(TestCase):
    """Test cases for MediaFile model."""

    def setUp(self):
        """Set up test environment."""
        self.media_file = MediaFile.objects.create(path="/test/path/file.mp4")

    def test_str_representation(self):
        """Test string representation of MediaFile."""
        self.assertEqual(str(self.media_file), "/test/path/file.mp4")

    def test_get_filename(self):
        """Test getting filename from path."""
        self.assertEqual(self.media_file.get_filename(), "file.mp4")

    @patch("os.path.exists")
    def test_exists_on_disk(self, mock_exists):
        """Test checking if file exists on disk."""
        mock_exists.return_value = True
        self.assertTrue(self.media_file.exists_on_disk())

        mock_exists.return_value = False
        self.assertFalse(self.media_file.exists_on_disk())

    @patch("os.stat")
    @patch("os.path.exists")
    def test_create_or_update_from_path(self, mock_exists, mock_stat, mock_stat):
        """Test creating or updating MediaFile from path."""
        mock_exists.return_value = True
        mock_stat.return_value = mock_stat

        # Test creating new file
        path = "/data/new.mp4"
        MediaFile.create_or_update_from_path(path)

        media_file = MediaFile.objects.get(path=path)
        self.assertEqual(media_file.st_size, mock_stat.st_size)
        self.assertEqual(media_file.dirname, "/data")
        self.assertEqual(media_file.ext, ".mp4")

    def test_rename_dirname_if_sub_folders(self):
        """Test renaming directory if it contains subfolders."""
        with patch("apps.shows.models.list_all_possible_folders") as mock_list:
            mock_list.return_value = ["/test"]
            # Test implementation here
            pass

    def test_rename_to_improved_file_pathname(self):
        """Test renaming file to improved pathname."""
        with patch("apps.shows.utils.ai.extract_movie_title") as mock_extract:
            mock_extract.return_value = "Improved Name"
            # Test implementation here
            pass

    @patch("os.remove")
    def test_remove_from_disk(self, mock_remove):
        """Test removing file from disk."""
        self.media_file.remove_from_disk()

        mock_remove.assert_called_once_with("/test/path/file.mp4")
        self.assertFalse(MediaFile.objects.filter(pk=self.media_file.pk).exists())

    def test_update_file_stats(self, mock_stat):
        """Test updating file stats."""
        current_time = time.time()

        self.media_file.update_file_stats(mock_stat)

        self.assertEqual(self.media_file.st_mode, mock_stat.st_mode)
        self.assertEqual(self.media_file.st_uid, mock_stat.st_uid)
        self.assertEqual(self.media_file.st_size, mock_stat.st_size)
        self.assertTrue(abs(self.media_file.last_read_from_disk - current_time) < 1)

    def test_keep_flag(self):
        """Test keep flag based on path."""
        self.media_file.path = "/data/keep/test.mp4"
        self.media_file.update_file_stats(mock_stat)
        self.assertTrue(self.media_file.keep)

        self.media_file.path = "/test/path/file.mp4"
        self.media_file.update_file_stats(mock_stat)
        self.assertFalse(self.media_file.keep)

    def test_is_movie_flag(self):
        """Test is_movie flag based on path."""
        self.media_file.path = "/data/movies/test.mp4"
        self.media_file.update_file_stats(mock_stat)
        self.assertTrue(self.media_file.is_movie)

        self.media_file.path = "/data/tv/test.mp4"
        self.media_file.update_file_stats(mock_stat)
        self.assertFalse(self.media_file.is_movie)
