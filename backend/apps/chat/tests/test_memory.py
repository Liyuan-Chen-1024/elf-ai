import json
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model

import pytest

from apps.chat.models import Conversation, Memory, Message
from apps.chat.tasks import extract_memories_task, generate_agent_response

User = get_user_model()


@pytest.mark.django_db
class TestMemoryFeatures:
    def test_extract_memories_task(self):
        user = User.objects.create_user(username="memuser", password="password")

        with patch("apps.chat.tasks.OpenAI") as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client

            # Mock response from LLM
            mock_response = MagicMock()
            new_profile = {"personal": {"age": 25}, "interests": ["pizza"]}
            mock_response.choices = [
                MagicMock(message=MagicMock(content=json.dumps(new_profile)))
            ]
            mock_client.chat.completions.create.return_value = mock_response

            extract_memories_task(str(user.id), "I am 25 years old and I like pizza")

            # Should be exactly one memory object (OneToOne)
            assert Memory.objects.count() == 1
            memory = Memory.objects.get(user=user)
            assert memory.data == new_profile

    def test_generate_agent_response_with_memory(self):
        user = User.objects.create_user(username="chatuser", password="password")
        # Create memory with JSON data
        Memory.objects.create(user=user, data={"personal": {"name": "Bob"}})

        conversation = Conversation.objects.create(user=user, title="Chat")
        ai_message = Message.objects.create(
            conversation=conversation, role="agent", content="", is_generating=True
        )

        with (
            patch("apps.chat.tasks.OpenAI") as mock_openai,
            patch("apps.chat.tasks.extract_memories_task.delay") as mock_extract,
            patch(
                "apps.chat.tasks.update_conversation_summary_task.delay"
            ) as mock_summary,
        ):

            mock_client = MagicMock()
            mock_openai.return_value = mock_client

            # Mock streaming response
            mock_chunk = MagicMock()
            mock_chunk.choices = [MagicMock(delta=MagicMock(content="Hi Bob"))]
            mock_client.chat.completions.create.return_value = [mock_chunk]

            generate_agent_response("Hello", str(ai_message.id))

            # Verify system prompt contains memory
            call_kwargs = mock_client.chat.completions.create.call_args.kwargs
            messages = call_kwargs["messages"]
            system_msg = messages[0]
            assert system_msg["role"] == "system"
            # The system prompt should contain the JSON string of the memory
            assert '"name": "Bob"' in system_msg["content"]

            # Verify extraction was triggered
            mock_extract.assert_called_once()
