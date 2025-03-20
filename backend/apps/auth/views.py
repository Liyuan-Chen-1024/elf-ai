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
from rest_framework.response import Response

User = get_user_model()

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login endpoint that accepts email/username and password, returns token and user data.
    """
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"detail": "Please provide both username and password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

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
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    })

@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Return the profile of the currently authenticated user.
    """
    user = request.user

    # Create a dictionary with the user data
    data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
    }

    return Response(data)

@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change the password of the currently authenticated user.
    """
    user = request.user
    current_password = request.data.get("current_password")
    new_password = request.data.get("new_password")

    # Validate input
    if not current_password or not new_password:
        return Response(
            {"detail": "Current password and new password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check if current password is correct
    if not user.check_password(current_password):
        return Response(
            {"detail": "Current password is incorrect."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Set new password
    user.set_password(new_password)
    user.save()

    return Response(
        {"detail": "Password changed successfully."}, status=status.HTTP_200_OK
    )
