import os
import sys

import debugpy

# Configure debugpy to not stop on entry
debugpy.configure({"subProcess": False})
debugpy.listen(("0.0.0.0", 5678))

# Don't wait for client
debugpy.connect(("0.0.0.0", 5678), access_token=None)

# Continue with Django management commands
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
from django.core.management import execute_from_command_line

execute_from_command_line(sys.argv)
