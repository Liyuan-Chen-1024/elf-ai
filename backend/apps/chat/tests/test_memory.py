import pytest
from unittest.mock import MagicMock, patch
from django.contrib.auth import get_user_model
from apps.chat.models import Conversation, Message, Memory
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
            mock_response.choices = [
                MagicMock(message=MagicMock(content="- User is 25 years old\n- User likes pizza"))
            ]
            mock_client.chat.completions.create.return_value = mock_response
            
            extract_memories_task(str(user.id), "I am 25 years old and I like pizza")
            
            assert Memory.objects.count() == 2
            memories = Memory.objects.filter(user=user).order_by("content")
            # Ordering by content: "User is..." comes before "User likes..." ? No, 'i' vs 'l'. 
            # "User is..." vs "User likes..." -> 'i' < 'l'.
            # Let's just check existence
            contents = [m.content for m in memories]
            assert "User is 25 years old" in contents
            assert "User likes pizza" in contents

    def test_generate_agent_response_with_memory(self):
        user = User.objects.create_user(username="chatuser", password="password")
        Memory.objects.create(user=user, content="User name is Bob")
        
        conversation = Conversation.objects.create(user=user, title="Chat")
        ai_message = Message.objects.create(
            conversation=conversation,
            role="agent",
            content="",
            is_generating=True
        )
        
        with patch("apps.chat.tasks.OpenAI") as mock_openai, \
             patch("apps.chat.tasks.extract_memories_task.delay") as mock_extract:
            
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
            assert "User name is Bob" in system_msg["content"]
            
            # Verify extraction was triggered
            mock_extract.assert_called_once()

