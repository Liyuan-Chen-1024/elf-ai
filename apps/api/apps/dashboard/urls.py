from django.urls import path

from . import views

urlpatterns = [
    path("deploy/<str:service>/", views.deploy_service),
]
