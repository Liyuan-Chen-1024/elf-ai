from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated


class BaseViewSet(viewsets.ModelViewSet):
    """Base viewset for all viewsets in the application."""
    permission_classes = [IsAuthenticated] 