from django.test import TestCase

class BasicTest(TestCase):
    def test_basic_addition(self):
        """
        Basic test to verify our test setup works
        """
        self.assertEqual(1 + 1, 2)

    def test_environment(self):
        """
        Test that we're using the test environment
        """
        from django.conf import settings
        self.assertEqual(settings.APP_ENVIRONMENT, 'test') 