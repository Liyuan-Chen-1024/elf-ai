"""Tests for file cleaning utilities."""

import os

from django.conf import settings
from django.test import TestCase

from apps.core.utils import set_django_settings
from apps.shows.utils.files import list_all_possible_folders

set_django_settings()


class UtilsFilesTestCase(TestCase):
    def setUp(self):
        self.original_storage = settings.STORAGE
        settings.STORAGE = ["/storage1", "/storage2"]

    def tearDown(self):
        settings.STORAGE = self.original_storage

    def test_list_all_possible_folders(self):
        expected_folders = [
            os.path.join("/storage1", "tvshows/"),
            os.path.join("/storage1", "movies/"),
            os.path.join("/storage1", "keep/tvshows/"),
            os.path.join("/storage1", "keep/movies/"),
            os.path.join("/storage2", "tvshows/"),
            os.path.join("/storage2", "movies/"),
            os.path.join("/storage2", "keep/tvshows/"),
            os.path.join("/storage2", "keep/movies/"),
        ]
        actual_folders = list_all_possible_folders()
        self.assertEqual(sorted(actual_folders), sorted(expected_folders))
