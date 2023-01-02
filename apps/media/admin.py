from django.contrib import admin

from .models import TVShow

class TVShowAdmin(admin.ModelAdmin):
    list_display = ('epguide_name', 'full_name', 'current_season', 'current_episode', 'active', 'keep', 'last_release_date', 'next_release_date', 'datetime_added')
    search_fields = ['epguide_name', 'full_name']
    list_filter = ('active', 'keep')


admin.site.register(TVShow, TVShowAdmin)

