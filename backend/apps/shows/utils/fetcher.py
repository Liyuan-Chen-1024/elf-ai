from typing import Any, Dict, Optional

import requests

from apps.core.exceptions import (
    EpisodeNotFoundException,
    SeasonNotFoundException,
    ShowNotFoundException,
)
from apps.core.logging import get_logger

logger = get_logger(__name__)


def epguides_api_request(path: str) -> Optional[Dict[str, Any]]:
    return parse_json_from_url("https://epguides.frecar.no/{0}".format(path))


def parse_json_from_url(url: str) -> Optional[Dict[str, Any]]:
    logger.log.info("Reading data from: %s" % url)
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
