"""Tests for epguides utilities."""

from unittest import TestCase
from unittest.mock import patch

from apps.shows.utils.epguides_utils import (
    extract_epguide_key,
    find_and_process_new_epguide_keys,
)


def test_extract_epguide_key():
    """Test extract_epguide_key function."""
    assert extract_epguide_key("https://epguides.com/ShowName/") == "ShowName"
    assert extract_epguide_key("https://epguides.com/ShowName") == "ShowName"
    assert extract_epguide_key("http://epguides.com/ShowName/") == "ShowName"
    assert extract_epguide_key("http://epguides.com/ShowName") == "ShowName"
    assert extract_epguide_key("/ShowName/") == "ShowName"
    assert extract_epguide_key("/ShowName") == "ShowName"
    assert extract_epguide_key("ShowName/") == "ShowName"
    assert extract_epguide_key("ShowName") == "ShowName"
    assert extract_epguide_key("") == ""


class TestFindAndProcessNewEpguideKeys(TestCase):
    """Test for finding and processing new epguide keys."""

    @patch("apps.shows.utils.epguides_utils.fetch_all_epguide_shows")
    def test_find_and_process_new_epguide_keys(self, mock_fetch):
        """Test finding and processing new epguide keys."""
        mock_fetch.return_value = ["show1", "show2", "show3"]
        result = find_and_process_new_epguide_keys(activate=True)
        self.assertEqual(result, ["show1", "show2", "show3"])
