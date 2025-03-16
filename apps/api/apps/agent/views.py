"""
API views for the agent tools system.
"""

import json
from typing import Any, Dict, List

from django.http import JsonResponse, HttpResponse, StreamingHttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication

from .service import AgentService
from .tools import registry


# Create a singleton service instance
agent_service = AgentService()


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def parse_tool_query(request: Request) -> Response:
    """
    Parse a user query and identify potential tools that can handle it.
    
    Args:
        request: The request object containing the query
        
    Returns:
        Response containing matched tools and their parameters
    """
    data = request.data
    query = data.get('query', '')
    
    if not query:
        return Response(
            {"error": "Query is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse the query to find matching tools
    matches = agent_service.parse_query(query)
    
    return Response({
        "query": query,
        "matches": matches,
    })


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def execute_tool(request: Request) -> Response:
    """
    Execute a specific tool with the provided parameters.
    
    Args:
        request: The request object containing tool and parameters
        
    Returns:
        Response containing the tool execution result
    """
    data = request.data
    tool_name = data.get('tool')
    params = data.get('params', {})
    
    if not tool_name:
        return Response(
            {"error": "Tool name is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Execute the tool using the service
    result = agent_service.execute_tool_by_name(tool_name, params)
    
    # Check for error
    if not result.get("success") and "error" in result:
        return Response(
            {"error": result["error"]},
            status=status.HTTP_404_NOT_FOUND if "not found" in result["error"] else status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response(result)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def list_tools(request: Request) -> Response:
    """
    List all available tools and their schemas.
    
    Args:
        request: The request object
        
    Returns:
        Response containing all tools and their schemas
    """
    tools = registry.get_all_tools()
    categories = registry.get_all_categories()
    
    tool_schemas = [tool.get_schema() for tool in tools]
    
    category_schemas = {}
    for category in categories:
        category_tools = registry.get_tools_by_category(category)
        category_schemas[category] = [tool.get_schema() for tool in category_tools]
    
    return Response({
        "tools": tool_schemas,
        "categories": category_schemas,
    })


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def get_tool_schema(request: Request, tool_name: str) -> Response:
    """
    Get the schema for a specific tool.
    
    Args:
        request: The request object
        tool_name: The name of the tool
        
    Returns:
        Response containing the tool schema
    """
    tool = registry.get_tool(tool_name)
    
    if not tool:
        return Response(
            {"error": f"Tool '{tool_name}' not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response(tool.get_schema()) 