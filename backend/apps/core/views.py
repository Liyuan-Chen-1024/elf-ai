from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.middleware.csrf import get_token
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response


class BaseViewSet(viewsets.ModelViewSet):
    """Base viewset for all viewsets in the application."""

    permission_classes = [IsAuthenticated]
