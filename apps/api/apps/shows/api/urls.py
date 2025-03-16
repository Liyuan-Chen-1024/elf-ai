"""API URLs for shows app."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.shows.api.views import MediaFileViewSet, TVShowViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'media-files', MediaFileViewSet)
router.register(r'tv-shows', TVShowViewSet)

# URL patterns
urlpatterns = [
    path('', include(router.urls)),
] 