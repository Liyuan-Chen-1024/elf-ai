from django.urls import path

from . import views

urlpatterns = [
    path("test_chat/", views.rename_filenames),
    path("test_chat_dirs/", views.rename_dirs),
]
