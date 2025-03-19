"""API views for the core app."""
from rest_framework import response, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


class HealthCheckViewSet(viewsets.ViewSet):
    """Health check viewset."""

    permission_classes = [AllowAny]

    def list(self, request):
        """Simple health check endpoint."""
        return Response({"status": "ok"}, status=status.HTTP_200_OK)


@api_view(["GET", "OPTIONS"])
@permission_classes([AllowAny])
def cors_test_view(request):
    """Simple view to test CORS."""
    return Response({"message": "CORS is working!"}) 