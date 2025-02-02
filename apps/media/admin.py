import datetime

from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from django.db import models
from django.utils.safestring import mark_safe

from .models import MediaFile, TVShow


class StatusFilter(SimpleListFilter):
    title = "status"
    parameter_name = "status"

    def lookups(self, request, model_admin):
        return (
            ("up_to_date", "Up to date"),
            ("behind", "Behind"),
            ("expired", "Expired"),
        )

    def queryset(self, request, queryset):
        if self.value() == "up_to_date":
            return [obj.id for obj in queryset if obj.get_status()[0] == "Up to date"]
        if self.value() == "behind":
            return [obj.id for obj in queryset if obj.get_status()[0] == "Behind"]
        if self.value() == "expired":
            return [obj.id for obj in queryset if obj.get_status()[0] == "Expired"]


class TVShowAdmin(admin.ModelAdmin):
    list_display = (
        "epguide_name",
        "full_name",
        "status_display",
        "current_season",
        "current_episode",
        "active",
        "keep",
        "last_release_date",
        "next_release_date",
        "datetime_added",
    )
    search_fields = ["epguide_name", "full_name"]
    list_filter = ("active", "keep", StatusFilter)

    def status_display(self, obj):
        status, color = obj.get_status()
        return mark_safe(f"<span style='color: {color}'>{status}</span>")

    status_display.short_description = "Status"


admin.site.register(TVShow, TVShowAdmin)


class MediaFileAdmin(admin.ModelAdmin):
    list_display = ("path", "ext", "category", "keep", "gb_size")
    search_fields = ["path"]
    list_filter = ("ext", "keep", "is_movie")

    def gb_size(self, obj):
        return round(obj.st_size / 1024**3, 2)

    gb_size.admin_order_field = "st_size"
    gb_size.short_description = "GB Size"

    def category(self, obj):
        return "Movie" if obj.is_movie else "TV Show"

    category.admin_order_field = "is_movie"
    category.short_description = "Category"


admin.site.register(MediaFile, MediaFileAdmin)
