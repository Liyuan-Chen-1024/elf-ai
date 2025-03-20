from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError

from apps.core.models import UserKnowledgeBase
from apps.core.services import KnowledgeBaseService

User = get_user_model()


class Command(BaseCommand):
    help = "Reset or initialize a user's knowledge base"

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="Username of the user")
        parser.add_argument(
            "--template",
            choices=["default", "sample"],
            default="default",
            help="Template to use for initialization",
        )
        parser.add_argument(
            "--force",
            action="store_true",
            help="Force reset even if knowledge base exists",
        )

    def handle(self, *args, **options):
        username = options["username"]
        template = options["template"]
        force = options["force"]

        try:
            # Get the user
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"User '{username}' does not exist")

        # Check if knowledge base exists
        knowledge_base_exists = UserKnowledgeBase.objects.filter(user=user).exists()

        if knowledge_base_exists and not force:
            self.stdout.write(
                self.style.WARNING(
                    f"Knowledge base for user '{username}' already exists. "
                    "Use --force to reset it."
                )
            )
            return

        # Delete existing knowledge base if it exists
        if knowledge_base_exists:
            UserKnowledgeBase.objects.filter(user=user).delete()
            self.stdout.write(
                self.style.SUCCESS(f"Deleted existing knowledge base for '{username}'")
            )

        # Initialize with template
        if template == "default":
            # Use the default template
            knowledge_base = KnowledgeBaseService.get_or_create_knowledge_base(user)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created knowledge base for '{username}' with default template"
                )
            )

        elif template == "sample":
            # Create with sample data
            sample_knowledge_text = """
# User Knowledge Base

## Personal Information
- Name: John Smith
- Location: San Francisco, CA
- Occupation: Software Engineer
- Age: 32

## Topics of Interest
- Programming (Python, JavaScript)
- Machine Learning
- Hiking and outdoor activities
- Cooking Italian food
- Science fiction books and movies

## Preferences
- Prefers dark mode interfaces
- Likes detailed technical explanations
- Enjoys humor in conversations
- Prefers text over voice interfaces
- Likes to learn about new technologies

## Personality Traits
- Detail-oriented
- Curious about how things work
- Values efficiency
- Enjoys learning new skills
- Patient when solving complex problems

## Communication Style
- Direct and to the point
- Appreciates technical depth
- Responds well to humor
- Prefers structured responses
- Engages well with examples

## Important Dates
- Birthday: March 15

## Relationships
- Has a dog named Max
- Mentions working with a team of developers
            """

            # Sample structured data
            sample_topics = {
                "interests": [
                    "programming",
                    "machine learning",
                    "hiking",
                    "cooking",
                    "science fiction",
                ]
            }

            sample_preferences = {
                "name": "John Smith",
                "location": "San Francisco, CA",
                "theme": "dark mode",
                "explanations": "detailed",
                "humor": "enjoys",
                "interface": "text",
            }

            try:
                knowledge_base = UserKnowledgeBase.objects.create(
                    user=user,
                    knowledge_text=sample_knowledge_text,
                    topics=sample_topics,
                    preferences=sample_preferences,
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created knowledge base for '{username}' with sample data"
                    )
                )
            except IntegrityError:
                self.stdout.write(
                    self.style.ERROR(
                        f"Failed to create knowledge base for '{username}'"
                    )
                )
                return

        # Display a preview
        self.stdout.write(
            self.style.SUCCESS(
                f"Knowledge base for '{username}' has been initialized successfully"
            )
        )
        self.stdout.write("\nPreview of knowledge text:")
        self.stdout.write("-" * 80)
        self.stdout.write(knowledge_base.knowledge_text[:500] + "...")
        self.stdout.write("-" * 80) 