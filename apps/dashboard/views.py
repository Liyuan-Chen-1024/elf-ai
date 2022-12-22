import os
import time

from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import authentication_classes, permission_classes

@api_view(['GET'])    
@authentication_classes([])
@permission_classes([])
def deploy_service(request, service):
    queue_file = os.path.expanduser('/deployservice/queue')
    
    current_queue = {}
    current_queue[service] = int(time.time())
    print(current_queue)
    with open(queue_file, "r") as queue:
        for line in queue.readlines():
            service, ts = line.split(",")
            ts = int(ts.strip())

            if ts < time.time() - 120:
                continue

            if service not in current_queue:
                current_queue = ts
            else:
                if current_queue[service] < ts:
                    current_queue[service] = ts
    
    with open(queue_file, "w") as queue:
        for item in current_queue.items():
            queue.write("{0},{1}\n".format(item[0], item[1]))
    
    return HttpResponse('OK')
