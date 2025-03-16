import json
import os
import time
import re
import asyncio
import requests
from datetime import datetime
import uuid
import logging

from django.http import HttpResponse, StreamingHttpResponse
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
    action,
)
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.db import transaction
from django.utils import timezone
from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    MessageCreateSerializer,
    MessageUpdateSerializer
)
from rest_framework.exceptions import Throttled
from apps.agent.service import AgentService
from django.conf import settings

# Helper functions for Agent system

def get_system_prompt():
    """Return the system prompt for Elf AI with its capabilities"""
    return """You are Elf AI v0.1, an advanced AI assistant with special capabilities beyond the base model.

In addition to general knowledge and helpfulness, you have the following enhanced features:
1. You can manage TV shows and movie downloads for Plex
2. You can provide overviews of what's already in the Plex library
3. You can control smart home devices like Philips Hue lights
4. You're friendly, helpful, and identify yourself as "Elf AI" rather than any other model name

You have access to the following tools:
- get_tv_shows: Lists all TV shows in the Plex library
- add_tv_show: Adds a new TV show to the download queue
- get_movies: Lists all movies in the Plex library
- add_movie: Adds a new movie to the download queue
- hue_lights: Control Philips Hue lights - turn on/off, change brightness, color, etc.

When I ask about TV shows, movies, or smart home devices, you'll automatically use the appropriate tools to help me.

Always maintain your identity as Elf AI v0.1 throughout the conversation.
"""

# Create a singleton instance of the agent service
agent_service = AgentService()

# Set up a logger
logger = logging.getLogger(__name__)

@api_view(["GET", "POST"])
@authentication_classes([])
@permission_classes([])
def rename_filenames(request):

    # Define the URL for the Ollama API
    url = "http://llm.frecar.no/api/generate"

    # Define the payload
    payload = {
        "model": "qwen2.5:7b",  # Change to your preferred model, e.g., "llama3"
        "prompt": """
        Transform the following input to match the pattern 'Title SXXEYY.<file_extension>'. Capitalize the first letter of each word in the title and keep the original file extension if present.
        
        Examples:
        1. Shark.Tank.S11E12.1080p.AMZN.WEB-DL.DDP5.1.H.264-FLUX[EZTVx.to].mkv => Shark Tank S11E12.mkv
        2. How.I.Met.Your.Mother.S10E02.720p.mkv => How I Met Your Mother S10E02.mkv
        3. Friends.S02.E01.AMAZON.mkv => Friends S02E01.mkv
        4. daredevil.again.s05e02.1080p.web.h264-successfulcrab[EZTVx.to].mkv => Daredevil S05E02.mkv
        5. The.Office.US.S05E14.1080p.BluRay.x264.mkv => The Office US S05E14.mkv
        6. Game.of.Thrones.S08E03.720p.HDTV.x264.mkv => Game of Thrones S08E03.mkv
        7. Breaking.Bad.S03E07.1080p.WEB-DL.DD5.1.H.264.mp4 => Breaking Bad S03E07.mp4
        8. Stranger.Things.S02E09.1080p.NF.WEB-DL.DDP5.1.H.264-NTG.mkv => Stranger Things S02E09.mkv
        
        Special case, some shows are using dates instead of season and episode, in that case the format should be 'Title <date>.<file_extension>', e.g:
        9. seth.meyers.2025.02.03.james.marsden.[x.to].mkv => Seth Meyers 2025.02.03.mkv
        
        Input: 'last.week.tonight.with.john.oliver.s12e03.-successfulcrab[x.to].mkv'
        Output: Only the new transformed string, keeping the original file extension
        """,
        "stream": False,  # Set to True if you want streaming responses
    }

    # Make the POST request
    response = requests.post(url, json=payload)

    # Parse and print the response
    if response.status_code == 200:
        response_data = response.json()
        print(response_data.get("response", "No response received"))
    else:
        print(f"Error: {response.status_code}, {response.text}")

    print(response_data.get("response"))
    return HttpResponse("OK")




@api_view(["GET", "POST"])
@authentication_classes([])
@permission_classes([])
def rename_dirs(request):

    # Define the URL for the Ollama API
    url = "http://llm.frecar.no/api/generate"

    # Define the payload
    payload = {
        "model": "qwen2.5:7b",  # Change to your preferred model, e.g., "llama3"
        "prompt": """
        Transform the following input to match the pattern 'Title SXXEYY' for directories. Capitalize the first letter of each word in the title.
        
        Examples (input => output)
        1. Shark.Tank.S11E12.1080p.AMZN.WEB-DL.DDP5.1.H.264-FLUX[EZTVx.to] => Shark Tank S11E12
        2. How.I.Met.Your.Mother.S10E02.720p => How I Met Your Mother S10E02
        3. Friends.S02.E01.AMAZON => Friends S02E01
        4. daredevil.again.s05e02.1080p.web.h264-successfulcrab[EZTVx.to] => Daredevil S05E02
        5. The.Office.US.S05E14.1080p.BluRay.x264 => The Office US S05E14
        6. Game.of.Thrones.S08E03.720p.HDTV.x264 => Game of Thrones S08E03
        7. Breaking.Bad.S03E07.1080p.WEB-DL.DD5.1.H.264 => Breaking Bad S03E07
        8. Stranger.Things.S02E09.1080p.NF.WEB-DL.DDP5.1.H.264-NTG => Stranger Things S02E09
        
        Special case, some shows are using dates instead of season and episode, in that case the format should be 'Title <date>', e.g:
        9. seth.m.2025.02.03.james.marsden.[x.to] => Seth Meyers 2025.02.03
        
        Note, if no tv show with the title exists, correct the title to a real show title, examples:
        10. seth.bayer.2025.02.03.james.marsden.[x.to] => Seth Meyers 2025.02.03
        11. Game.Thrones.S08E03.720p.HDTV.x264 => Game of Thrones S08E03

        Input: 'last.week.tonight.with.j.oliver 1080p.BluRay.x264 S02E04'
        Output: Only the new transformed string
        """,
        "stream": False,  # Set to True if you want streaming responses
    }

    # Make the POST request
    response = requests.post(url, json=payload)

    # Parse and print the response
    if response.status_code == 200:
        response_data = response.json()
        print(response_data.get("response", "No response received"))
    else:
        print(f"Error: {response.status_code}, {response.text}")

    print(response_data.get("response"))
    return HttpResponse("OK dirs")


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]

    def get_queryset(self):
        return Conversation.objects.filter(
            user=self.request.user,
            is_deleted=False
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def clear(self, request, pk=None):
        conversation = self.get_object()
        conversation.clear_messages()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        content = serializer.validated_data['content']

        # Add a small delay to help with rate limiting issues
        time.sleep(0.1)
        
        # Save user message
        with transaction.atomic():
            user_message = Message.objects.create(
                conversation=conversation,
                role='user',
                content=content
            )

            # Create placeholder for assistant message
            assistant_message = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content="Thinking..."
            )

        # First check if this query can be handled by agent tools
        system_prompt = get_system_prompt()
        is_agent_query, agent_response = agent_service.handle_chat_query(content, system_prompt)
        
        if is_agent_query and agent_response:
            # Update the assistant message with the agent tool response
            assistant_message.content = agent_response
            assistant_message.save()
            
            return Response({
                "user_message": MessageSerializer(user_message).data,
                "assistant_message": MessageSerializer(assistant_message).data,
                "handled_by_agent": True
            })
        
        # If not handled by agent tools, proceed with LLM API call
        try:
            # Define the URL for the Ollama API
            url = settings.LLM_API_URL

            # Get the last 5 messages to provide context
            recent_messages = Message.objects.filter(
                conversation=conversation,
                is_deleted=False
            ).order_by('created_at')[:5]

            # Get the system prompt using the helper function
            system_prompt = get_system_prompt()

            conversation_context = system_prompt + "\n\n"
            for msg in recent_messages:
                role = "user" if msg.role == 'user' else "assistant"
                conversation_context += f"{role}: {msg.content}\n"

            # Add the current query
            conversation_context += f"user: {content}\n"
            conversation_context += "assistant: "

            # Prepare the payload for the API
            payload = {
                "model": settings.LLM_MODEL_NAME,
                "prompt": conversation_context,
                "stream": False,
            }

            # Make the POST request
            response = requests.post(url, json=payload)
            
            if response.status_code == 200:
                response_data = response.json()
                assistant_content = response_data.get("response", "I'm sorry, I couldn't generate a response at the moment.")
                
                # Update the assistant message with the response
                assistant_message.content = assistant_content
                assistant_message.save()
                
                return Response({
                    "user_message": MessageSerializer(user_message).data,
                    "assistant_message": MessageSerializer(assistant_message).data,
                    "handled_by_agent": False
                })
            else:
                # Handle API error
                error_message = f"Sorry, I encountered an error: {response.status_code}, {response.text}"
                assistant_message.content = error_message
                assistant_message.save()
                
                return Response({
                    "user_message": MessageSerializer(user_message).data,
                    "assistant_message": MessageSerializer(assistant_message).data,
                    "error": error_message
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            # Handle general exception
            error_message = f"Sorry, I encountered an error: {str(e)}"
            assistant_message.content = error_message
            assistant_message.save()
            
            return Response({
                "user_message": MessageSerializer(user_message).data,
                "assistant_message": MessageSerializer(assistant_message).data,
                "error": error_message
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def stream_message(self, request, pk=None):
        conversation = self.get_object()
        serializer = MessageCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        content = serializer.validated_data['content']

        def event_stream():
            try:
                # Save user message
                with transaction.atomic():
                    user_message = Message.objects.create(
                        conversation=conversation,
                        role='user',
                        content=content
                    )

                    # Create placeholder for assistant message
                    assistant_message = Message.objects.create(
                        conversation=conversation,
                        role='assistant',
                        content=""
                    )

                # First check if this query can be handled by agent tools
                try:
                    system_prompt = get_system_prompt()
                    is_agent_query, agent_response = agent_service.handle_chat_query(content, system_prompt)
                    
                    if is_agent_query and agent_response:
                        # Update the assistant message with the agent tool response
                        assistant_message.content = agent_response
                        assistant_message.save()
                        
                        # Send the agent response as a single token
                        data = {
                            'type': 'update',
                            'content': agent_response,
                            'messageId': str(assistant_message.id),
                            'status': 'complete'
                        }
                        yield f"data: {json.dumps(data)}\n\n"
                        
                        # Send completion event
                        yield f"data: {json.dumps({'type': 'done'})}\n\n"
                        return
                except Exception as e:
                    logger.error(f"Error processing agent query: {str(e)}", exc_info=True)
                    # Continue with normal LLM processing if agent tools fail

                # Get conversation history for context
                recent_messages = Message.objects.filter(
                    conversation=conversation,
                    is_deleted=False
                ).order_by('created_at').exclude(id=assistant_message.id)[:5]

                # Get the system prompt using the helper function
                system_prompt = get_system_prompt()

                conversation_context = system_prompt + "\n\n"
                for msg in recent_messages:
                    role = "user" if msg.role == 'user' else "assistant"
                    conversation_context += f"{role}: {msg.content}\n"

                # Add the current query
                prompt = f"{conversation_context}\nUser: {content}\nAssistant:"

                # Send initial loading message
                data = {
                    'type': 'token',
                    'content': '',
                    'messageId': str(assistant_message.id),
                    'status': 'thinking'
                }
                yield f"data: {json.dumps(data)}\n\n"

                # Define the URL for the Ollama API
                url = settings.LLM_API_URL

                # Define the payload with conversation context
                payload = {
                    "model": settings.LLM_MODEL_NAME,
                    "prompt": prompt,
                    "stream": True
                }

                try:
                    # Make the streaming request with a reasonable timeout
                    response = requests.post(url, json=payload, stream=True, timeout=15)
                    
                    if response.status_code == 200:
                        full_response = ""
                        temp_chunks = []  # Store response chunks temporarily
                        
                        # Process the streaming response
                        for line in response.iter_lines():
                            if line:
                                try:
                                    json_line = json.loads(line.decode('utf-8'))
                                    token = json_line.get('response', '')
                                    
                                    if token:
                                        full_response += token
                                        temp_chunks.append(token)
                                        
                                        # Update the assistant message
                                        assistant_message.content = full_response
                                        assistant_message.save()
                                        
                                        # Send the token to the client
                                        data = {
                                            'type': 'token',
                                            'content': token,
                                            'messageId': str(assistant_message.id),
                                            'status': 'generating'
                                        }
                                        yield f"data: {json.dumps(data)}\n\n"
                                except json.JSONDecodeError:
                                    continue
                        
                        # Check if the complete response can be handled by agent tools
                        # This allows recognizing agent commands in the entire response
                        try:
                            is_agent_query, agent_response = agent_service.handle_chat_query(full_response, system_prompt)
                            
                            if is_agent_query and agent_response:
                                # Update the assistant message with the agent response
                                assistant_message.content = agent_response
                                assistant_message.save()
                                
                                # Send a special update message to replace the content
                                data = {
                                    'type': 'update',
                                    'content': agent_response,
                                    'messageId': str(assistant_message.id),
                                    'status': 'complete'
                                }
                                yield f"data: {json.dumps(data)}\n\n"
                        except Exception as e:
                            logger.error(f"Error processing agent response: {str(e)}", exc_info=True)
                            # Continue with the normal response
                                
                        # Update conversation title if it's the first message
                        if conversation.title == "New conversation" and user_message.id == conversation.messages.earliest('created_at').id:
                            try:
                                # Generate a title based on the first message
                                title_payload = {
                                    "model": settings.LLM_MODEL_NAME,
                                    "prompt": f"Generate a short, concise title (3-5 words) for a conversation that starts with this message: '{content}'. Title:",
                                    "stream": False
                                }
                                title_response = requests.post(url, json=title_payload, timeout=10)
                                if title_response.status_code == 200:
                                    title_data = title_response.json()
                                    new_title = title_data.get("response", "").strip()
                                    if new_title:
                                        conversation.title = new_title
                                        conversation.save()
                            except Exception as e:
                                logger.error(f"Error generating title: {str(e)}", exc_info=True)
                                # Continue without setting a title
                    else:
                        # Handle API error
                        error_message = f"I apologize, but I'm having trouble connecting to my knowledge base right now. Error code: {response.status_code}"
                        assistant_message.content = error_message
                        assistant_message.save()
                        
                        data = {
                            'type': 'token',
                            'content': error_message,
                            'messageId': str(assistant_message.id),
                            'status': 'error'
                        }
                        yield f"data: {json.dumps(data)}\n\n"
                except requests.exceptions.Timeout:
                    # Handle timeout
                    error_message = "I apologize, but the request to my knowledge base timed out. Please try again later."
                    assistant_message.content = error_message
                    assistant_message.save()
                    
                    data = {
                        'type': 'token',
                        'content': error_message,
                        'messageId': str(assistant_message.id),
                        'status': 'error'
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                except requests.exceptions.ConnectionError:
                    # Handle connection error
                    error_message = "I apologize, but I'm having trouble connecting to my knowledge base right now. Please check your internet connection and try again."
                    assistant_message.content = error_message
                    assistant_message.save()
                    
                    data = {
                        'type': 'token',
                        'content': error_message,
                        'messageId': str(assistant_message.id),
                        'status': 'error'
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                except Exception as e:
                    # Handle any other API errors
                    error_message = f"I encountered an unexpected error while processing your request: {str(e)[:100]}"
                    assistant_message.content = error_message
                    assistant_message.save()
                    
                    data = {
                        'type': 'token',
                        'content': error_message,
                        'messageId': str(assistant_message.id),
                        'status': 'error'
                    }
                    yield f"data: {json.dumps(data)}\n\n"
            
            except Exception as e:
                logger.error(f"Error in streaming: {str(e)}", exc_info=True)
                error_message = "I encountered an error while processing your request."
                
                try:
                    # Try to update the message in the database
                    assistant_message.content = error_message
                    assistant_message.save()
                except:
                    pass
                
                data = {
                    'type': 'token',
                    'content': error_message,
                    'messageId': str(assistant_message.id),
                    'status': 'error'
                }
                yield f"data: {json.dumps(data)}\n\n"

            # Send completion event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        # Set up response with appropriate headers
        response = StreamingHttpResponse(
            event_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.filter(is_deleted=False)
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        conversation_id = self.request.query_params.get('conversation_id')
        if conversation_id:
            print(f"Filtering messages for conversation {conversation_id}")
            queryset = queryset.filter(conversation_id=conversation_id)
        return queryset.order_by('created_at')
    
    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()

    # Override throttle handlers
    def throttled(self, request, wait):
        """
        If request is throttled, determine what kind of exception to raise.
        """
        raise Throttled(
            detail={
                "message": f"Rate limit exceeded. Please wait {wait} seconds before retrying.",
                "wait": wait
            },
            wait=wait
        )
