from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("media/", include("apps.media.urls")),
    path("chat/", include("apps.chat.urls")),
    path("dashboard/", include("apps.dashboard.urls")),
    path("api-auth/", include("rest_framework.urls")),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
