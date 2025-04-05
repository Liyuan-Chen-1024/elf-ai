from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token

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
        email = "admin@example.com"
        password = "admin"

        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.SUCCESS(f'User {username} already exists')
            )
            return

        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )

        # Create auth token for the user
        token, _ = Token.objects.get_or_create(user=user)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created test user:\n"
                f"Username: {username}\n"
                f"Email: {email}\n"
                f"Password: {password}\n"
                f"Token: {token.key}"
            )
        )
