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
            "topics": knowledge_base.topics.get("topics", []),
            "created_at": knowledge_base.created_at,
            "updated_at": knowledge_base.updated_at,
            "knowledge_version": knowledge_base.knowledge_version,
        }
        
        return Response(data)
        
    elif request.method == "PATCH":
        # Only allow updating specific fields
        allowed_fields = ["topics", "knowledge_text"]
        updated_fields = []
        
        for field in request.data:
            if field not in allowed_fields:
                return Response(
                    {"error": f"Field '{field}' cannot be updated"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if "topics" in request.data:
            try:
                topics_data = request.data["topics"]
                if not isinstance(topics_data, list):
                    return Response(
                        {"error": "Topics must be an array"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Validate topic format
                for topic in topics_data:
                    if not isinstance(topic, dict):
                        return Response(
                            {"error": "Each topic must be an object"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Check required fields
                    required_fields = ["name", "description", "rank"]
                    missing_fields = [f for f in required_fields if f not in topic]
                    if missing_fields:
                        return Response(
                            {"error": f"Topic missing required fields: {', '.join(missing_fields)}"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Validate name (single word or acronym)
                    if not isinstance(topic["name"], str) or len(topic["name"].split()) > 1:
                        return Response(
                            {"error": f"Topic name '{topic['name']}' must be a single word or acronym"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Validate description
                    if not isinstance(topic["description"], str) or len(topic["description"]) > 100:
                        return Response(
                            {"error": f"Topic description must be a string <= 100 characters"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Validate rank
                    if not isinstance(topic["rank"], (int, float)) or not 0 <= topic["rank"] <= 1:
                        return Response(
                            {"error": "Topic rank must be a number between 0 and 1"}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                
                knowledge_base.topics = {"topics": topics_data}
                updated_fields.append("topics")
            except Exception as e:
                return Response(
                    {"error": f"Invalid topics format: {str(e)}"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if "knowledge_text" in request.data:
            knowledge_base.knowledge_text = request.data["knowledge_text"]
            knowledge_base.knowledge_version += 1
            updated_fields.append("knowledge_text")
        
        if updated_fields:
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
