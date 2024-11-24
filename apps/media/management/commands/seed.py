from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from apps.media.models import TVShow


class Command(BaseCommand):
    help = "Closes the specified poll for voting"

    def create_admin(self):
        u = User.objects.get_or_create(username="admin")[0]
        u.is_superuser = True
        u.is_staff = True
        u.set_password("admin")
        u.save()

    def create_tv_shows(self):
        shows = [
            ("sharktank", "Shark Tank"),
            ("glee", "Glee"),
            ("howimetyourmother", "How I met your mother"),
        ]
        for [show, full_name] in shows:
            show = TVShow.objects.get_or_create(epguide_name=show)[0]
            show.full_name = full_name
            show.current_season = 1
            show.current_episode = 1
            show.active = True
            show.save()

    def handle(self, *args, **options):
        if settings.DEBUG == True:
            self.create_admin()
            self.create_tv_shows()
