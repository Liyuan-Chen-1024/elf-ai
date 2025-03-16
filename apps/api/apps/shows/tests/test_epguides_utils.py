"""Tests for epguides utilities."""
from unittest.mock import patch

from django.test import TestCase

from apps.shows.utils.epguides_utils import find_and_process_new_epguide_keys

class TestEpguidesUtils(TestCase):
    """Test cases for epguides utilities."""

    @patch("apps.shows.utils.epguides_utils.requests.get")
    @patch("time.sleep", return_value=None)  # To skip actual sleep during tests
    def test_find_and_process_new_epguide_keys(self, mock_sleep, mock_get):
        """Test finding and processing new epguide keys."""
        mock_response = MagicMock()
        mock_response.content = (
            b'<a href="../show1/">Show 1</a><a href="../show2/">Show 2</a>'
        )
        mock_get.return_value = mock_response

        find_and_process_new_epguide_keys()

        self.assertEqual(
            mock_get.call_count, 3
        )  # One for the initial fetch, two for the shows
        mock_get.assert_any_call("http://epguides.com/menu/current.shtml")
        mock_get.assert_any_call("http://epguides.frecar.no/show/show1")
        mock_get.assert_any_call("http://epguides.frecar.no/show/show2")


if __name__ == "__main__":
    unittest.main()
