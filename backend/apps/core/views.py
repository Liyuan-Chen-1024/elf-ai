from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from django.middleware.csrf import get_token


@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_token_view(request: Request) -> Response:
    """
    Returns a CSRF token in a cookie.
    This view doesn't return the actual token in the response,
    but sets a cookie that the frontend can use.
    """
    # This will set the CSRF cookie
    get_token(request)
    # Return an empty response, the token is set in the cookie
    return Response({"detail": "CSRF cookie set"})
