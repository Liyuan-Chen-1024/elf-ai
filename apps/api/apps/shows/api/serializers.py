"""API serializers for shows app."""
from rest_framework import serializers

from apps.shows.models import TVShow, MediaFile


class MediaFileSerializer(serializers.ModelSerializer):
    """Serializer for MediaFile model."""
    
    class Meta:
        model = MediaFile
        fields = [
            'id', 'path', 'dirname', 'ext', 'st_size', 
            'last_read_from_disk', 'keep', 'is_movie',
        ]
        read_only_fields = [
            'st_mode', 'st_uid', 'st_gid', 'st_atime', 
            'st_mtime', 'st_ctime',
        ]


class TVShowSerializer(serializers.ModelSerializer):
    """Serializer for TVShow model."""
    
    status = serializers.SerializerMethodField()
    status_color = serializers.SerializerMethodField()
    
    class Meta:
        model = TVShow
        fields = [
            'id', 'epguide_name', 'full_name', 'current_season',
            'current_episode', 'active', 'keep', 'datetime_edited',
            'datetime_added', 'downloaded_current_episode',
            'episode_lookup_type', 'first_release_date',
            'last_release_date', 'last_release_season',
            'last_release_episode', 'next_release_date',
            'status', 'status_color',
        ]
        read_only_fields = [
            'datetime_edited', 'datetime_added', 'first_release_date',
            'last_release_date', 'last_release_season',
            'last_release_episode', 'next_release_date',
        ]
    
    def get_status(self, obj: TVShow) -> str:
        """Get show status."""
        status, _ = obj.get_status()
        return status
    
    def get_status_color(self, obj: TVShow) -> str:
        """Get show status color."""
        _, color = obj.get_status()
        return color 