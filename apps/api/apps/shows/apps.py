"""Shows app configuration."""
from django.apps import AppConfig


class ShowsConfig(AppConfig):
    """Configuration for the shows app."""
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.shows"
    label = "shows"
