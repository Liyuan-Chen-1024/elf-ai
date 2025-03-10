from django.contrib import admin
from django.contrib.admin import SimpleListFilter
from django.utils.safestring import mark_safe

from .models import MediaFile, TVShow


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
    list_filter = ("active", "keep")
    ordering = ["-next_release_date", "full_name"]

    def status_display(self, obj):
        status, color = obj.get_status()
        return mark_safe(f"<span style='color: {color}'>{status}</span>")

    status_display.short_description = "Status"


admin.site.register(TVShow, TVShowAdmin)


class MediaFileAdmin(admin.ModelAdmin):
    list_display = (
        "path",
        "renamed_from",
        "ext",
        "renamed_from",
        "category",
        "keep",
        "gb_size",
    )
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
