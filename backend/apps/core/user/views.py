from django.contrib.auth import authenticate, get_user_model, login
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse
import logging

from .serializers import LoginSerializer, UserProfileSerializer, ChangePasswordSerializer

User = get_user_model()
logger = logging.getLogger(__name__)

@extend_schema(
    request=LoginSerializer,
    responses={
        200: OpenApiResponse(
            response={"type": "object", "properties": {
                "token": {"type": "string"},
                "user": {"type": "object"}
            }},
            description="Login successful"
        ),
        400: OpenApiResponse(description="Invalid credentials")
    }
)
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request: Request) -> Response:
    """
    Login endpoint that accepts email/username and password, returns token and user data.
    """
    # Debug information
    logger.info(f"Login attempt from {request.META.get('REMOTE_ADDR')}")
    logger.info(f"Headers: {request.headers}")
    
    # Check for CSRF token
    csrf_token = request.META.get('HTTP_X_CSRFTOKEN')
    if csrf_token:
        logger.info(f"CSRF token present: {csrf_token[:5]}...")
    else:
        logger.warning("CSRF token missing in request")
    
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    username = serializer.validated_data["username"]
    password = serializer.validated_data["password"]

    # Authenticate user
    user = authenticate(username=username, password=password)

    if not user:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Get or create token
    token, created = Token.objects.get_or_create(user=user)
    
    # If token exists but has an empty key, regenerate it
    if not token.key:
        token.delete()
        token = Token.objects.create(user=user)

    # Login user (create session)
    login(request, user)

    # Return user data and token
    return Response({
        "token": token.key,
        "user": UserProfileSerializer(user).data
    })

@extend_schema(
    responses={200: UserProfileSerializer}
)
@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request: Request) -> Response:
    """
    Return the profile of the currently authenticated user.
    """
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)

@extend_schema(
    request=ChangePasswordSerializer,
    responses={
        200: OpenApiResponse(description="Password changed successfully"),
        400: OpenApiResponse(description="Invalid password")
    }
)
@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def change_password(request: Request) -> Response:
    """
    Change the password for the currently authenticated user.
    """
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Check old password
    if not request.user.check_password(serializer.validated_data["old_password"]):
        return Response(
            {"old_password": "Wrong password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Set new password
    request.user.set_password(serializer.validated_data["new_password"])
    request.user.save()

    return Response({"detail": "Password changed successfully."})
