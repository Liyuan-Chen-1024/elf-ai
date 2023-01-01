from core.settings import *

DEBUG = False

ALLOWED_HOSTS = ['jarvis.frecar.no']
CSRF_TRUSTED_ORIGINS = ['https://jarvis.frecar.no']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'jarvis',
        'USER': 'jarvis',
        'PASSWORD': 'insdifusdn',
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}

## App

TX_HOST = '192.168.1.10'


STORAGE = [
    '/nstore1/',
    '/nstore2/',
    '/nstore3/'
]