from django.urls import path

from . import views

urlpatterns = [
    path('tvshows/', views.tvshows_list),
    path('tvshows/<int:pk>/', views.tvshows_detail),
]