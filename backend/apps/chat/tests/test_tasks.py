from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model

import pytest

from apps.chat.models import Conversation, Message
from apps.chat.tasks import generate_agent_response

User = get_user_model()


@pytest.mark.django_db
class TestChatTasks:
    def test_generate_agent_response_success(self):
        # Setup
        user = User.objects.create_user(username="testuser", password="password")
        conversation = Conversation.objects.create(user=user, title="Test Chat")

        # Create user message (not strictly needed for the task but good for context)
        Message.objects.create(
            conversation=conversation, role="user", content="Hello AI"
        )

        # Create agent message placeholder
        ai_message = Message.objects.create(
            conversation=conversation,
            role="agent",
            content="",
            is_generating=True,
            status_generating="Queued",
        )

        # Mock OpenAI client and response
        with patch("apps.chat.tasks.OpenAI") as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client

            # Mock streaming response
            mock_chunk1 = MagicMock()
            mock_chunk1.choices = [
                MagicMock(delta=MagicMock(content="Hello", tool_calls=None))
            ]

            mock_chunk2 = MagicMock()
            mock_chunk2.choices = [
                MagicMock(delta=MagicMock(content=" world", tool_calls=None))
            ]

            mock_client.chat.completions.create.return_value = [
                mock_chunk1,
                mock_chunk2,
            ]

            # Execute task
            generate_agent_response("Hello AI", str(ai_message.id))

            # Verify
            ai_message.refresh_from_db()
            assert ai_message.content == "Hello world"
            assert ai_message.is_generating is False
            assert ai_message.status_generating == "Completed"

            # Verify OpenAI called correctly
            mock_client.chat.completions.create.assert_called_once()
            call_kwargs = mock_client.chat.completions.create.call_args.kwargs
            messages = call_kwargs["messages"]
            assert len(messages) >= 2
            assert messages[0]["role"] == "system"
            assert messages[-1] == {"role": "user", "content": "Hello AI"}
            assert call_kwargs["stream"] is True

    def test_generate_agent_response_error(self):
        # Setup
        user = User.objects.create_user(username="testuser2", password="password")
        conversation = Conversation.objects.create(user=user, title="Test Chat Error")

        ai_message = Message.objects.create(
            conversation=conversation, role="agent", content="", is_generating=True
        )

        # Mock OpenAI to raise exception
        with patch("apps.chat.tasks.OpenAI") as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client
            mock_client.chat.completions.create.side_effect = Exception("API Error")

            # Execute task and expect exception
            with pytest.raises(Exception, match="API Error"):
                generate_agent_response("Hello", str(ai_message.id))

            # Verify error state
            ai_message.refresh_from_db()
            assert "Error generating response" in ai_message.content
            assert ai_message.is_generating is False
            assert ai_message.status_generating == "Error occurred"
