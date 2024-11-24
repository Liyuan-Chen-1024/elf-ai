from django.urls import path

from . import views

urlpatterns = [
    path("tvshows/", views.tvshows_list),
    path(
        "tvshows/<int:pk>/download_current_episode",
        views.tvshows_download_current_episode,
    ),
    path("tvshows/<int:pk>/", views.tvshows_detail),
]
