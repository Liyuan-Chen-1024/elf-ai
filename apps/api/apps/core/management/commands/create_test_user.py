from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Creates a test user for development"

    def handle(self, *args, **kwargs):
        if not settings.DEBUG:
            self.stdout.write(
                self.style.WARNING("This command is only for development environments")
            )
            return

        username = "admin"
        password = "admin"
        email = "admin@example.com"

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.SUCCESS(f'Test user "{username}" already exists')
            )
            return

        User.objects.create_superuser(username=username, email=email, password=password)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created test user:\n"
                f"Username: {username}\n"
                f"Password: {password}\n"
                f"Email: {email}"
            )
        )
