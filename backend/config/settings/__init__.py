"""Django settings package."""

import os

# Load appropriate settings based on environment
env = os.environ.get("DJANGO_ENV", "development")

if env == "production":
    from .production import *  # noqa
elif env == "staging":
    from .staging import *  # noqa
else:
    from .development import *  # noqa
