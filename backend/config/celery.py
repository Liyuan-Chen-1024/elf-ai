import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

# Create the Celery app
app = Celery('elfai')

# Read config from Django settings, prefix with CELERY_
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load tasks from all registered Django app configs
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 