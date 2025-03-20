from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.middleware.csrf import get_token
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework.response import Response

from .models import UserKnowledgeBase
from .services import KnowledgeBaseService


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


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def user_knowledge_base_view(request):
    """
    Get or update the current user's knowledge base.
    
    GET: Retrieves the current user's knowledge base
    PATCH: Updates specific fields in the knowledge base
    """
    
    # Get or create the knowledge base for the current user
    knowledge_base = KnowledgeBaseService.get_or_create_knowledge_base(request.user)
    
    if request.method == "GET":
        # Return the knowledge base data
        data = {
            "id": str(knowledge_base.id),
            "user_id": str(request.user.id),
            "knowledge_text": knowledge_base.knowledge_text,
            "topics": knowledge_base.topics,
            "preferences": knowledge_base.preferences,
            "created_at": knowledge_base.created_at,
            "updated_at": knowledge_base.updated_at,
            "knowledge_version": knowledge_base.knowledge_version,
        }
        
        return Response(data)
        
    elif request.method == "PATCH":
        # Only allow updating specific fields
        allowed_fields = ["topics", "preferences", "knowledge_text"]
        updated_fields = []
        
        for field in allowed_fields:
            if field in request.data:
                setattr(knowledge_base, field, request.data[field])
                updated_fields.append(field)
        
        if updated_fields:
            # If knowledge_text was updated manually, increment the version
            if "knowledge_text" in updated_fields:
                knowledge_base.knowledge_version += 1
                
            knowledge_base.save()
            
            return Response({
                "message": f"Knowledge base updated: {', '.join(updated_fields)}",
                "updated_at": knowledge_base.updated_at
            })
        else:
            return Response(
                {"error": "No valid fields to update"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
