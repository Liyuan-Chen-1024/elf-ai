"""API views for shows app."""
from typing import Any, Dict, List, Optional, Type, Union
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.core.views import BaseModelViewSet
from apps.shows.api.serializers import MediaFileSerializer, TVShowSerializer
from apps.shows.models import MediaFile, TVShow
from apps.shows.services.tv_show_service import TVShowService


class MediaFileViewSet(BaseModelViewSet):
    """ViewSet for MediaFile model."""
    
    queryset = MediaFile.objects.all()
    serializer_class = MediaFileSerializer
    filterset_fields = ["keep", "is_movie"]
    search_fields = ["path"]
    ordering_fields = ["path", "size", "created_at", "updated_at"]
    ordering = ["-created_at"]
    
    @action(detail=True, methods=["post"])
    def scan(self, request: Request, pk: int = None) -> Response:
        """Scan media file."""
        media_file = self.get_object()
        media_file.update_file_stats(media_file.path)
        return Response({"status": "success"})
    
    @action(detail=True, methods=["post"])
    def delete(self, request: Request, pk: int = None) -> Response:
        """Delete media file."""
        media_file = self.get_object()
        media_file.remove_from_disk()
        return Response({"status": "success"})


class TVShowViewSet(BaseModelViewSet):
    """ViewSet for TVShow model."""
    
    queryset = TVShow.objects.all()
    serializer_class = TVShowSerializer
    filterset_fields = ["active", "keep", "downloaded_current_episode"]
    search_fields = ["name", "epguide_name"]
    ordering_fields = ["name", "current_season", "current_episode", "datetime_edited", "datetime_added"]
    ordering = ["name"]
    tv_show_service = TVShowService()
    
    @action(detail=True, methods=["post"])
    def download_current_episode(self, request: Request, pk: int = None) -> Response:
        """Download current episode."""
        tv_show = self.get_object()
        success = self.tv_show_service.download_current_episode(tv_show)
        return Response({"status": "success" if success else "failed"})
    
    @action(detail=True, methods=["post"])
    def update_metadata(self, request: Request, pk: int = None) -> Response:
        """Update show metadata."""
        tv_show = self.get_object()
        self.tv_show_service.update_show_metadata(tv_show)
        return Response({"status": "success"})
    
    @action(detail=True, methods=["get"])
    def status(self, request: Request, pk: int = None) -> Response:
        """Get show status."""
        tv_show = self.get_object()
        status, color = tv_show.get_status()
        return Response({
            "status": status,
            "color": color,
        })

    @action(detail=True, methods=["get"])
    def current_episode(self, request: Request, pk: int = None) -> Response:
        """Get current episode information."""
        tv_show = self.get_object()
        episode = tv_show.fetch_current_episode()
        return Response(episode)

    @action(detail=True, methods=["get"])
    def next_episode(self, request: Request, pk: int = None) -> Response:
        """Get next episode information."""
        tv_show = self.get_object()
        episode = tv_show.get_next_episode()
        return Response(episode)

    @action(detail=True, methods=["get"])
    def current_episode_released(self, request: Request, pk: int = None) -> Response:
        """Check if current episode has been released."""
        tv_show = self.get_object()
        released = tv_show.current_episode_released()
        return Response({"released": released})

    @action(detail=True, methods=["get"])
    def next_episode_released(self, request: Request, pk: int = None) -> Response:
        """Check if next episode has been released."""
        tv_show = self.get_object()
        released = tv_show.next_episode_released()
        return Response({"released": released}) 