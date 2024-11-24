import logging
import logging.config
import os

import requests
from django.conf import settings

from apps.media.utils.exceptions import (
    EpisodeNotFoundException,
    SeasonNotFoundException,
    ShowNotFoundException,
)

# Configure logging
LOGGING_CONF = os.path.join(settings.BASE_DIR, "logging.ini")
logging.config.fileConfig(LOGGING_CONF)
log = logging.getLogger("jarvis_fetcher")


def epguides_api_request(path):
    return parse_json_from_url("https://epguides.frecar.no/{0}".format(path))


def parse_json_from_url(url):
    log.info("Reading data from: %s" % url)
    response = requests.get(url)

    if response.status_code == 200:
        return response.json()

    if b"Episode not found" in response.content:
        raise EpisodeNotFoundException()
    elif b"Season not found" in response.content:
        raise SeasonNotFoundException()
    elif b"Show not found" in response.content:
        raise ShowNotFoundException()

    return None
