import os
import logging
import logging.config
from django.conf import settings
import requests

# Configure logging
LOGGING_CONF = os.path.join(settings.BASE_DIR, "logging.ini")
logging.config.fileConfig(LOGGING_CONF)
log = logging.getLogger("jarvis_fetcher")

def get_tvshow_download_folder(keep=False):
    return 'tv_folder'
    #if keep:
    #    return random.choice(config.items("tvshow_download_folders_keep"))[1]
    #else:
    #    return random.choice(config.items("tvshow_download_folders"))[1]

def get_movie_download_folder():
    return 'movie_folder'
    #return random.choice(config.items("movie_download_folders"))[1]

def epguides_api_request(path):
    return parse_json_from_url('https://epguides.frecar.no/{0}'.format(path))

def potato_api_request(path):
    return parse_json_from_url('https://potato.frecar.no/{0}'.format(path))

def parse_json_from_url(url):
    log.info("Reading data from: %s" % url)
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    return None
