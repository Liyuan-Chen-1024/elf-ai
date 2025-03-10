import logging
import re
import time

import requests

logger = logging.getLogger(__name__)


def find_and_process_new_epguide_keys():
    try:
        current_content = requests.get("http://epguides.com/menu/current.shtml")
        logger.info("Fetched current content from epguides.com")
    except requests.RequestException as e:
        logger.error(f"Error fetching current content: {e}")
        return

    epguide_keys = re.findall(b'href="..\/([\w+]*)\/"\>', current_content.content)
    logger.info(f"Found {len(epguide_keys)} epguide keys")

    for key in epguide_keys:
        url = f"http://epguides.frecar.no/show/{key.decode('utf-8').lower()}"
        logger.info(f"Processing URL: {url}")
        try:
            requests.get(url)
            time.sleep(5)
            logger.info(f"Finished processing URL: {url}")
        except requests.RequestException as e:
            logger.error(f"Error processing URL {url}: {e}")
