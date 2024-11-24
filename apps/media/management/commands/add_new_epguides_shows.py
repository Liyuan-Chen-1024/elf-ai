import re
import time

import requests
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Closes the specified poll for voting"

    def handle(self, *args, **options):
        current_content = requests.get("http://epguides.com/menu/current.shtml")

        epguide_keys = re.findall(b'href="..\/([\w+]*)\/"\>', current_content.content)

        for key in epguide_keys:
            url = "http://epguides.frecar.no/show/{0}".format(
                key.decode("utf-8").lower()
            )
            requests.get(url)
            time.sleep(5)
