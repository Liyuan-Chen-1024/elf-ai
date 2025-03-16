from typing import Any, Dict, List, Optional, Union, cast
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request as DRFRequest
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import TVShow
from .serializers import TVShowSerializer
from .services.tv_show_service import TVShowService
from .types import JsonDict, ProcessingResult


@require_http_methods(["GET"])
def tvshows_list(request: HttpRequest) -> JsonResponse:
    """List all TV shows.
    
    Args:
        request: The HTTP request object
        
    Returns:
        JsonResponse containing list of TV shows
    """
    shows = TVShow.objects.all()
    data: List[JsonDict] = [
        {
            "id": show.id,
            "name": show.name,
            "epguide_name": show.epguide_name,
            "current_season": show.current_season,
            "current_episode": show.current_episode,
            "active": show.active,
            "keep": show.keep,
        }
        for show in shows
    ]
    return JsonResponse({"shows": data})


@require_http_methods(["GET"])
def tvshows_detail(request: HttpRequest, pk: int) -> JsonResponse:
    """Get details for a specific TV show.
    
    Args:
        request: The HTTP request object
        pk: Primary key of the TV show
        
    Returns:
        JsonResponse containing TV show details
        
    Raises:
        Http404: If TV show is not found
    """
    show = get_object_or_404(TVShow, pk=pk)
    service = TVShowService()
    status_value, color = service.get_show_status(show)
    
    data: JsonDict = {
        "id": show.id,
        "name": show.name,
        "epguide_name": show.epguide_name,
        "current_season": show.current_season,
        "current_episode": show.current_episode,
        "active": show.active,
        "keep": show.keep,
        "status": status_value.value,
        "status_color": color.value,
    }
    return JsonResponse(data)


@require_http_methods(["POST"])
def tvshows_download_current_episode(request: HttpRequest, pk: int) -> JsonResponse:
    """Download the current episode for a TV show.
    
    Args:
        request: The HTTP request object
        pk: Primary key of the TV show
        
    Returns:
        JsonResponse containing download status
        
    Raises:
        Http404: If TV show is not found
    """
    show = get_object_or_404(TVShow, pk=pk)
    service = TVShowService()
    
    try:
        success = service.download_current_episode(show)
        result: ProcessingResult = {
            "success": success,
            "error": None if success else "Download failed",
            "data": None,
        }
        return JsonResponse(result)
    except Exception as e:
        result: ProcessingResult = {
            "success": False,
            "error": str(e),
            "data": None,
        }
        return JsonResponse(result, status=500)


@api_view(["GET", "POST"])
def tvshows_list_rest(request: DRFRequest) -> Response:
    """REST API endpoint for listing and creating TV shows.
    
    Args:
        request: The DRF request object
        
    Returns:
        Response containing list of TV shows or created TV show
        
    Raises:
        ValidationError: If request data is invalid
    """
    if request.method == "GET":
        tvshows = TVShow.objects.all()
        serializer = TVShowSerializer(tvshows, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = TVShowSerializer(data=request.data)
        if serializer.is_valid():
            try:
                tvshow = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                raise ValidationError(detail=str(e))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["GET", "PUT", "DELETE"])
def tvshows_detail_rest(request: DRFRequest, pk: int) -> Response:
    """REST API endpoint for retrieving, updating, and deleting TV shows.
    
    Args:
        request: The DRF request object
        pk: Primary key of the TV show
        
    Returns:
        Response containing TV show details or operation status
        
    Raises:
        Http404: If TV show is not found
        ValidationError: If request data is invalid
    """
    try:
        tvshow = TVShow.objects.get(pk=pk)
    except TVShow.DoesNotExist:
        return Response(
            {"error": "TVShow not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = TVShowSerializer(tvshow)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = TVShowSerializer(tvshow, data=request.data)
        if serializer.is_valid():
            try:
                tvshow = serializer.save()
                return Response(serializer.data)
            except Exception as e:
                raise ValidationError(detail=str(e))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        try:
            tvshow.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(["GET"])
def tvshows_download_current_episode_rest(request: DRFRequest, pk: int) -> Response:
    """REST API endpoint for downloading current episode of a TV show.
    
    Args:
        request: The DRF request object
        pk: Primary key of the TV show
        
    Returns:
        Response containing download status
        
    Raises:
        Http404: If TV show is not found
    """
    try:
        tvshow = TVShow.objects.get(pk=pk)
    except TVShow.DoesNotExist:
        return Response(
            {"error": "TVShow not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

    service = TVShowService()
    try:
        success = service.download_current_episode(tvshow)
        result: ProcessingResult = {
            "success": success,
            "error": None if success else "Download failed",
            "data": None,
        }
        return Response(result)
    except Exception as e:
        result: ProcessingResult = {
            "success": False,
            "error": str(e),
            "data": None,
        }
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
