"""Tests for the add_new_epguides_shows command."""

import unittest
from unittest.mock import patch

from django.core.management import call_command


class TestAddNewEpguidesShowsCommand(unittest.TestCase):
    @patch(
        "apps.media.management.commands.add_new_epguides_shows.find_and_process_new_epguide_keys"
    )
    def test_handle(self, mock_find_and_process_new_epguide_keys):
        call_command("add_new_epguides_shows")
        mock_find_and_process_new_epguide_keys.assert_called_once()


if __name__ == "__main__":
    unittest.main()
