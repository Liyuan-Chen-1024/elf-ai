"""Django settings package."""

import os

# Load appropriate settings based on environment
env = os.environ.get("DJANGO_ENV", "development")

if env == "production":
    from .production import *
else:
    from .development import *
