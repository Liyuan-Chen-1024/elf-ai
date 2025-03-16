"""Core app configuration."""
from django.apps import AppConfig


class CoreConfig(AppConfig):
    """Configuration for the core app."""
    
    name = 'apps.core'
    label = 'core'
    verbose_name = 'Core'
    
    def ready(self) -> None:
        """Perform initialization when Django starts."""
        # Import signal handlers
        from . import signals  # noqa 