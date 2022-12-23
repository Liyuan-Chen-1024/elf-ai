from core.settings import *

DEBUG = True

ALLOWED_HOSTS = ['jarvis.frecar.no']

DATABASES = {
    'default': {
        'host': 'mysql',
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'jarvis',
        'USERNAME': 'jarvis',
        'PASSWORD': 'insdifusdn'
    }
}
