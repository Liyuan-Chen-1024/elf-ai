"""Base serializer classes for the application."""
from rest_framework import serializers


class BaseModelSerializer(serializers.ModelSerializer):
    """Base serializer class for models."""
    
    class Meta:
        abstract = True 