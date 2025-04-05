from typing import List

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import user_knowledge_base_view

router = DefaultRouter()

app_name = "core"

urlpatterns: List[path] = [
    path("knowledge-base/", user_knowledge_base_view, name="knowledge-base"),
]
