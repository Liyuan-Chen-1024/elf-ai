from core.settings import *

DEBUG = True

ALLOWED_HOSTS = ['jarvis.frecar.no']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'jarvis',
        'USER': 'jarvis',
        'PASSWORD': 'insdifusdn',
        'HOST': 'mysql',
        'PORT': '3306',
    }
}
