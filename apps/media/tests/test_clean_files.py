from django.test import TestCase

from apps.media.management.commands.clean_downloaded_filenames import (
    ensure_file_extension,
    replace_chars,
    replace_words,
)
from core.utils import set_django_settings

set_django_settings()


class CleanDownloadedFilesTest(TestCase):

    def setUp(self):
        pass

    def test_upper(self):
        result = ensure_file_extension("modern.family.s01e02srt")
        self.assertEqual(result, "modern.family.s01e02.srt")

    def test_rename_files_1(self):
        name = ensure_file_extension("modern.family.s01e02srt")
        renamed_name = name.lower()
        renamed_name = replace_words(renamed_name)
        renamed_name = replace_chars(renamed_name)
        renamed_name = ensure_file_extension(renamed_name)
        self.assertEqual(renamed_name, "modern.family.s01e02.srt")
