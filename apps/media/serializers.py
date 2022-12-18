from rest_framework import serializers
from apps.media.models import TVShow

class TVShowSerializer(serializers.ModelSerializer):
    class Meta:
        model = TVShow
        exclude = []
