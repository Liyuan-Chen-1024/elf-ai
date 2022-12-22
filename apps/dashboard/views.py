import os
import subprocess

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
    
    with open(queue_file, "a") as queue:
        queue.write(service+"\n")
    
    return HttpResponse('OK')
