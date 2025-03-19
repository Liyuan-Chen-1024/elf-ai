from rest_framework import serializers


class HealthCheckSerializer(serializers.Serializer):
    status = serializers.CharField(read_only=True)
