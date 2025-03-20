from typing import List

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.core.api.views import HealthCheckViewSet, cors_test_view
from .views import csrf_token, user_knowledge_base_view

router = DefaultRouter()
router.register(r"health", HealthCheckViewSet, basename="health")

app_name = "core"

urlpatterns: List[path] = [
    path("", include(router.urls)),
    path("cors-test/", cors_test_view, name="cors-test"),
    path("csrf/", csrf_token, name="csrf"),
    path("knowledge-base/", user_knowledge_base_view, name="knowledge-base"),
]
