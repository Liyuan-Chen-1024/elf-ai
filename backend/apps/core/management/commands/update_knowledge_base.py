from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

from apps.core.services import KnowledgeBaseService
from apps.chat.models import Conversation, Message

User = get_user_model()


class Command(BaseCommand):
    help = "Process a test message to update a user's knowledge base"

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="Username of the user")
        parser.add_argument(
            "--message", 
            type=str, 
            default="I'm looking for a new job in software development. I currently work as a developer but I want to move into a senior role or team lead position. I'm particularly interested in AI and machine learning.",
            help="The message to process"
        )
        parser.add_argument(
            "--file",
            type=str,
            help="Path to a file containing the message to process"
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Reset the knowledge base before processing the message"
        )
        parser.add_argument(
            "--interactive",
            action="store_true",
            help="Run in interactive mode to input multiple messages"
        )

    def handle(self, *args, **options):
        username = options["username"]
        message_content = options["message"]
        file_path = options.get("file")
        reset = options["reset"]
        interactive = options["interactive"]

        try:
            # Get the user
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"User '{username}' does not exist")

        # Reset knowledge base if requested
        if reset:
            from apps.core.models import UserKnowledgeBase
            UserKnowledgeBase.objects.filter(user=user).delete()
            self.stdout.write(
                self.style.SUCCESS(f"Reset knowledge base for '{username}'")
            )

        # Get or create a conversation
        try:
            conversation = Conversation.objects.filter(user=user).order_by('-updated_at').first()
            if not conversation:
                conversation = Conversation.objects.create(
                    user=user,
                    title="Test Conversation"
                )
                self.stdout.write(self.style.SUCCESS(f"Created new conversation for '{username}'"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Using existing conversation: {conversation.title}"))
        except Exception as e:
            raise CommandError(f"Error getting or creating conversation: {str(e)}")

        # Process from file if provided
        if file_path:
            try:
                with open(file_path, 'r') as file:
                    message_content = file.read()
                self.stdout.write(self.style.SUCCESS(f"Loaded message from file: {file_path}"))
            except Exception as e:
                raise CommandError(f"Error reading file: {str(e)}")

        # Interactive mode
        if interactive:
            self.stdout.write(self.style.WARNING("Interactive mode. Type 'exit' to quit."))
            while True:
                message_content = input("\nEnter message (or 'exit'): ")
                if message_content.lower() == 'exit':
                    break
                self._process_message(user, conversation, message_content)
        else:
            # Process a single message
            self._process_message(user, conversation, message_content)
            
    def _process_message(self, user, conversation, message_content):
        """Process a single message and update the knowledge base."""
        # Create a message
        message = Message.objects.create(
            conversation=conversation,
            role="user",
            content=message_content,
            created_at=timezone.now(),
            id=uuid.uuid4()
        )

        # Process the message
        self.stdout.write(self.style.WARNING(f"Processing message: {message_content}"))
        knowledge_base = KnowledgeBaseService.update_knowledge_base_from_message(
            user=user,
            message=message
        )

        # Display the updated knowledge
        self.stdout.write(self.style.SUCCESS("Knowledge base updated successfully"))
        self.stdout.write("\nUpdated knowledge text:")
        self.stdout.write("-" * 80)
        self.stdout.write(knowledge_base.knowledge_text)
        self.stdout.write("-" * 80)
        
        # Display structured data
        self.stdout.write("\nStructured data:")
        self.stdout.write("-" * 80)
        self.stdout.write(f"Topics: {knowledge_base.topics}")
        self.stdout.write(f"Preferences: {knowledge_base.preferences}")
        self.stdout.write("-" * 80)
        
        return knowledge_base 