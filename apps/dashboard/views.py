import os
import time

from django.http import HttpResponse
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)


@api_view(["GET", "POST"])
@authentication_classes([])
@permission_classes([])
def deploy_service(request, service):
    # required_secret = "f2hf9hf9oh8f9o023fdoi"

    queue_file = os.path.expanduser("/deployservice/queue")

    current_queue = {}
    current_queue[service] = int(time.time())

    with open(queue_file, "r") as queue:
        for line in queue.readlines():
            service, ts = line.split(",")
            ts = int(ts.strip())

            if ts < time.time() - 60:
                continue

            if service not in current_queue:
                current_queue[service] = ts
            else:
                if current_queue[service] < ts:
                    current_queue[service] = ts

    with open(queue_file, "w") as queue:
        for item in current_queue.items():
            queue.write("{0},{1}\n".format(item[0], item[1]))

    return HttpResponse("OK")
