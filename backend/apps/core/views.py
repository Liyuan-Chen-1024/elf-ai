from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.middleware.csrf import get_token
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


class BaseViewSet(viewsets.ModelViewSet):
    """Base viewset for all viewsets in the application."""

    permission_classes = [IsAuthenticated]


@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_token(request):
    """
    Return a CSRF token that can be used for authenticated requests.
    This view forces a CSRF cookie to be set for clients.
    """
    token = get_token(request)
    return JsonResponse({"csrfToken": token})
