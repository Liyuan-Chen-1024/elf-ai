"""URL Configuration for the API."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import views as django_auth_views
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken import views as auth_views

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# Import our auth views
from apps.core.user.views import change_password, login_view, user_profile

# Customize admin site
admin.site.site_header = "AI Chat Admin"
admin.site.site_title = "AI Chat Admin Portal"
admin.site.index_title = "Welcome to AI Chat Admin Portal"

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # API documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/schema/swagger-ui/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/schema/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    # Health checks
    path("health/", include("health_check.urls")),
    # API endpoints
    path(
        "api/v1/",
        include(
            [
                path("core/", include("apps.core.urls")),
                path("chat/", include("apps.chat.urls")),
                path(
                    "auth/",
                    include(
                        [
                            path("login/", login_view, name="api-login"),
                            path(
                                "logout/",
                                django_auth_views.LogoutView.as_view(),
                                name="api-logout",
                            ),
                            path("profile/", user_profile, name="api-profile"),
                            path(
                                "change-password/",
                                change_password,
                                name="api-change-password",
                            ),
                        ]
                    ),
                ),
            ]
        ),
    ),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
