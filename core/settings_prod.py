from core.settings import *

DEBUG = False

ALLOWED_HOSTS = ['*.frecar.no']
CSRF_TRUSTED_ORIGINS = ['*.frecar.no']

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
