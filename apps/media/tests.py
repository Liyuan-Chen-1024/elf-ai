from django.test import TestCase
from core.utils import set_django_settings 

set_django_settings()

class AnimalTestCase(TestCase):

    def setUp(self):
        pass

    def test_upper(self):
        #a = 1 / 0
        self.assertEqual('foo'.upper(), 'FOO')

    def test_again(self):
        self.assertEqual('a', 'a')