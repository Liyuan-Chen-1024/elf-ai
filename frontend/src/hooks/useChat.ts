import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../services/chatApi';
import { useState, useEffect } from 'react';
import { Conversation, Message } from '../types';
import fetchClient from '../services/fetchClient';

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
      return await chatApi.getConversations();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Ensure conversations is always an array
  const conversations = Array.isArray(data) ? data : [];

  const createConversation = useMutation({
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
    }
  });

  const deleteConversation = useMutation({
    mutationFn: (id: string, options?: { onSuccess?: () => void }) => {
      return chatApi.deleteConversation(id).then(() => {
        options?.onSuccess?.();
        return id;
      });
    },
    onSuccess: (id: string) => {
      queryClient.removeQueries({ queryKey: CHAT_QUERY_KEYS.conversation(id) });
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversations,
        (oldData: Conversation[] | undefined) => oldData?.filter((conv: Conversation) => conv.id !== id)
      );
    },
  });

  const selectConversation = (id: string) => {
    setSelectedId(id);
    queryClient.fetchQuery({
      queryKey: CHAT_QUERY_KEYS.conversation(id),
      queryFn: () => chatApi.getConversation(id),
    });
  };

  return {
    conversations,
    selectedId,
    isLoading,
    error,
    refetch,
    createConversation: createConversation.mutateAsync,
    deleteConversation: deleteConversation.mutate,
    selectConversation,
    isCreating: createConversation.isPending,
    isDeleting: deleteConversation.isPending,
  };
}

export function useMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const [streamedResponse, setStreamedResponse] = useState('');

  // Clean up streaming state when conversation ID changes
  useEffect(() => {
    setStreamedResponse('');
    
    // Abort any existing streams for the previous conversation
    fetchClient.abortStreamsByUrl('/chat/conversations/');
    
    // Cleanup function to abort streams when component unmounts
    return () => {
      fetchClient.abortStreamsByUrl('/chat/conversations/');
    };
  }, [conversationId]);

  const {
    data: conversation,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
    queryFn: () => chatApi.getConversation(conversationId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 1,
  });

  const sendMessage = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (newMessage: Message) => {
      console.log("newMessage", newMessage);
      // Add user message to the conversation
      const updatedConversation = {
        ...conversation,
        messages: [...conversation.messages, newMessage],
        lastMessage: newMessage,
        messageCount: conversation.messageCount + 1,
      };
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


  return {
    conversation,
    isLoading,
    error,
    refetch,
    streamedResponse,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
  };
}
