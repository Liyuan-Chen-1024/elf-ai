from typing import List

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import csrf_token_view

router = DefaultRouter()

app_name = "core"

urlpatterns: List[path] = [
    path("", include(router.urls)),
    path("csrf-token/", csrf_token_view, name="csrf-token"),
]
