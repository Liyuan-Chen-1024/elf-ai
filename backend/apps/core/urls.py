from typing import List

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.core.api.views import HealthCheckViewSet, cors_test_view

router = DefaultRouter()
router.register(r"health", HealthCheckViewSet, basename="health")

urlpatterns: List[path] = [
    path("", include(router.urls)),
    path("cors-test/", cors_test_view, name="cors-test"),
]
