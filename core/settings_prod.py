from core.settings import *

DEBUG = True

ALLOWED_HOSTS = ['jarvis.frecar.no']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'db.sqlite3',
    }
}
