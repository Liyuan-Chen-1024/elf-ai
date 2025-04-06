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

@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token_view(request):
    """
    Returns a CSRF token in a cookie.
    This view doesn't return the actual token in the response,
    but sets a cookie that the frontend can use.
    """
    # This will set the CSRF cookie
    csrf_token = get_token(request)
    # Return an empty response, the token is set in the cookie
    return Response({"detail": "CSRF cookie set"})
