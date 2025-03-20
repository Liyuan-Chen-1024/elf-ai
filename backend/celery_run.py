import django
from django.utils import autoreload

django.setup()


def run_celery() -> None:
    from config.celery import celery_app

    args = "-A config.celery worker -l info"
    celery_app.worker_main(args.split(" "))


print("Starting celery worker with autoreload...")
autoreload.run_with_reloader(run_celery)
