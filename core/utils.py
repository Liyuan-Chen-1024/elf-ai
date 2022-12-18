import os
from django import setup
import os

def set_django_settings():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    setup()
