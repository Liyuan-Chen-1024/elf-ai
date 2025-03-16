from rest_framework import serializers

from apps.core.serializers import BaseModelSerializer

from .models import MediaFile, TVShow


class MediaFileSerializer(BaseModelSerializer):
    """Serializer for MediaFile model."""

    class Meta:
        model = MediaFile
        fields = [
            "id",
            "path",
            "size",
            "keep",
            "is_movie",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate_path(self, value: str) -> str:
        """Validate path field."""
        if not value:
            raise serializers.ValidationError("Path cannot be empty")
        return value


class TVShowSerializer(BaseModelSerializer):
    """Serializer for TVShow model."""

    status = serializers.SerializerMethodField()
    status_color = serializers.SerializerMethodField()

    class Meta:
        model = TVShow
        fields = [
            "id",
            "name",
            "epguide_name",
            "current_season",
            "current_episode",
            "active",
            "keep",
            "datetime_edited",
            "datetime_added",
            "downloaded_current_episode",
            "episode_lookup_type",
            "status",
            "status_color",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "status", "status_color"]

    def get_status(self, obj: TVShow) -> str:
        """Get show status."""
        status, _ = obj.get_status()
        return status

    def get_status_color(self, obj: TVShow) -> str:
        """Get status color."""
        _, color = obj.get_status()
        return color

    def validate_epguide_name(self, value: str) -> str:
        """Validate epguide_name field."""
        if not value:
            raise serializers.ValidationError("EPGuide name cannot be empty")
        return value

    def validate_current_season(self, value: int) -> int:
        """Validate current_season field."""
        if value < 1:
            raise serializers.ValidationError("Season number must be greater than 0")
        return value

    def validate_current_episode(self, value: int) -> int:
        """Validate current_episode field."""
        if value < 1:
            raise serializers.ValidationError("Episode number must be greater than 0")
        return value
