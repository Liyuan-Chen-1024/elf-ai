import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../services/api';
import { useState } from 'react';
import { Conversation, Message } from '../types';

export const CHAT_QUERY_KEYS = {
  conversations: ['conversations'],
  conversation: (id: string) => ['conversations', id],
  messages: (conversationId: string) => ['conversations', conversationId, 'messages'],
};

export function useConversations() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch all conversations
  const { 
    data,
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: CHAT_QUERY_KEYS.conversations,
    queryFn: async () => {
      try {
        const result = await chatApi.getConversations();
        
        // Ensure we always return an array
        if (Array.isArray(result)) {
          return result;
        } else if (result && typeof result === 'object') {
          // Handle case where API returns an object with results inside
          if ('results' in result && Array.isArray((result as { results: Conversation[] }).results)) {
            return (result as { results: Conversation[] }).results;
          }
          
          // If it's another type of object, log it and return empty array
          if (import.meta.env.DEV) {
            window.console.warn('Unexpected conversations data format:', result);
          }
          return [];
        }
        
        // Handle unexpected cases
        return [];
      } catch (error) {
        if (import.meta.env.DEV) {
          window.console.error('Error fetching conversations:', error);
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Ensure conversations is always an array
  const conversations = Array.isArray(data) ? data : [];

  // Create a new conversation
  const createMutation = useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: (newConversation: Conversation) => {
      if (import.meta.env.DEV) {
        window.console.log('✅ Successfully created conversation:', newConversation);
      }
      
      // Add the new conversation to the query cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversations,
        (oldData: Conversation[] | undefined) => [newConversation, ...(oldData || [])]
      );
      // Set the new conversation data
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(newConversation.id), 
        newConversation
      );
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) {
        const axiosError = error as { 
          response?: { 
            status?: number; 
            statusText?: string; 
            data?: unknown 
          } 
        };
        window.console.error('❌ Failed to create conversation:', {
          message: error.message,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          token: window.localStorage.getItem('authToken') ? 'Token exists' : 'No token',
        });
      }
    }
  });

  // Archive a conversation
  const archiveMutation = useMutation({
    mutationFn: chatApi.archiveConversation,
    onSuccess: (updatedConversation: Conversation) => {
      // Update the conversation in the query cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(updatedConversation.id),
        updatedConversation
      );
      // Update the conversation in the conversations list
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversations,
        (oldData: Conversation[] | undefined) => 
          oldData?.map((conv: Conversation) => 
            conv.id === updatedConversation.id ? updatedConversation : conv
          )
      );
    },
  });

  // Unarchive a conversation
  const unarchiveMutation = useMutation({
    mutationFn: chatApi.unarchiveConversation,
    onSuccess: (updatedConversation: Conversation) => {
      // Update the conversation in the query cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(updatedConversation.id),
        updatedConversation
      );
      // Update the conversation in the conversations list
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversations,
        (oldData: Conversation[] | undefined) => 
          oldData?.map((conv: Conversation) => 
            conv.id === updatedConversation.id ? updatedConversation : conv
          )
      );
    },
  });

  // Delete a conversation
  const deleteMutation = useMutation({
    mutationFn: (id: string, options?: { onSuccess?: () => void }) => {
      return chatApi.deleteConversation(id).then(() => {
        // Call onSuccess callback if provided
        options?.onSuccess?.();
        return id;
      });
    },
    onSuccess: (id: string) => {
      // Remove the conversation from the query cache
      queryClient.removeQueries({ queryKey: CHAT_QUERY_KEYS.conversation(id) });
      // Remove the conversation from the conversations list
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversations,
        (oldData: Conversation[] | undefined) => oldData?.filter((conv: Conversation) => conv.id !== id)
      );
    },
  });

  // Update a conversation
  const updateMutation = useMutation({
    mutationFn: chatApi.updateConversation,
    onSuccess: (updatedConversation: Conversation) => {
      // Update the conversation in the query cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(updatedConversation.id),
        updatedConversation
      );
      // Update the conversation in the conversations list
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversations,
        (oldData: Conversation[] | undefined) => 
          oldData?.map((conv: Conversation) => 
            conv.id === updatedConversation.id ? updatedConversation : conv
          )
      );
    },
  });

  // Select a conversation
  const selectConversation = (id: string) => {
    if (import.meta.env.DEV) {
      window.console.log('Selecting conversation:', id);
    }
    setSelectedId(id);
    // Actually fetch the conversation data, not just prefetch it
    queryClient.fetchQuery({
      queryKey: CHAT_QUERY_KEYS.conversation(id),
      queryFn: () => chatApi.getConversation(id),
    }).catch((error: unknown) => {
      // Log errors if the fetch fails
      if (import.meta.env.DEV) {
        window.console.error('Error fetching conversation:', error);
      }
    });
  };

  return {
    conversations,
    selectedId,
    isLoading,
    error,
    refetch,
    createConversation: createMutation.mutate,
    archiveConversation: archiveMutation.mutate,
    unarchiveConversation: unarchiveMutation.mutate,
    deleteConversation: deleteMutation.mutate,
    updateConversation: updateMutation.mutate,
    selectConversation,
    isCreating: createMutation.isPending,
    isArchiving: archiveMutation.isPending,
    isUnarchiving: unarchiveMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}

export function useConversation(id?: string) {
  const queryClient = useQueryClient();
  const [streamedResponse, setStreamedResponse] = useState('');
  const [isStreamError, setIsStreamError] = useState(false);

  const {
    data: conversation,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: id ? CHAT_QUERY_KEYS.conversation(id) : undefined,
    queryFn: () => id ? chatApi.getConversation(id) : null,
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Send a message
  const sendMessageMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (newMessage: Message) => {
      if (!conversation) return;
      
      // Update the messages in the conversation
      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, newMessage],
        lastMessage: newMessage,
        messageCount: conversation.messageCount + 1,
      };

      // Update the conversation in the query cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(conversation.id),
        updatedConversation
      );

      // Update the conversation in the conversations list
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversations,
        (oldData: Conversation[] | undefined) => 
          oldData?.map((conv: Conversation) => 
            conv.id === conversation.id ? {
              ...conv,
              lastMessage: newMessage,
              messageCount: conv.messageCount + 1,
            } : conv
          )
      );
    },
  });

  // Stream a message
  const streamMessageMutation = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) => {
      setStreamedResponse('');
      setIsStreamError(false);
      
      return chatApi.streamMessage({
        conversationId,
        content,
        onChunk: (chunk) => {
          // Check if the chunk is an error message
          if (chunk.startsWith("\n\nError:")) {
            setIsStreamError(true);
          }
          
          if (chunk === "Thinking...") {
            // Initial state - just set to "Thinking..."
            setStreamedResponse("Thinking...");
          } else if (chunk === "") {
            // Clear "Thinking..." when we get first real token
            setStreamedResponse("");
          } else {
            // Append new token to the current response
            setStreamedResponse(prev => {
              // If previous was "Thinking..." or empty, replace it
              if (prev === "Thinking..." || prev === "") {
                return chunk;
              }
              // Otherwise append the new token
              return prev + chunk;
            });
          }
        },
      }).catch((error) => {
        window.console.error("Stream message error:", error);
        setIsStreamError(true);
        setStreamedResponse(prev => 
          prev === "Thinking..." 
            ? "Error: Unable to generate response. Please try again." 
            : prev + "\n\nError: Connection failed. Please try again."
        );
        throw error;
      });
    },
    onSuccess: () => {
      if (!isStreamError) {
        // After streaming is complete, refetch the conversation to get the updated messages
        refetch();
        // Immediately clear the streamed response to avoid duplicates
        setStreamedResponse('');
      }
    },
    onSettled: () => {
      // Clear any streaming state
      if (!isStreamError) {
        setStreamedResponse('');
      }
    }
  });

  // Delete a message
  const deleteMessageMutation = useMutation({
    mutationFn: chatApi.deleteMessage,
    onSuccess: (_: unknown, id: string) => {
      if (!conversation) return;
      
      // Mark the message as deleted in the conversation
      const updatedConversation = {
        ...conversation,
        messages: conversation.messages.map((msg: Message) => 
          msg.id === id ? { ...msg, is_deleted: true } : msg
        ),
      };

      // Update the conversation in the query cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(conversation.id),
        updatedConversation
      );
    },
  });

  // Update a message
  const updateMessageMutation = useMutation({
    mutationFn: chatApi.updateMessage,
    onSuccess: (updatedMessage: Message) => {
      if (!conversation) return;
      
      // Update the message in the conversation
      const updatedConversation = {
        ...conversation,
        messages: conversation.messages.map((msg: Message) => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        ),
      };

      // Update the conversation in the query cache
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(conversation.id),
        updatedConversation
      );
    },
  });

  return {
    conversation,
    isLoading,
    error,
    refetch,
    streamedResponse,
    sendMessage: sendMessageMutation.mutate,
    streamMessage: streamMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    updateMessage: updateMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    isStreaming: streamMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
    isUpdating: updateMessageMutation.isPending,
  };
} 