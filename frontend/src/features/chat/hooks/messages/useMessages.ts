import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../../../services/chatApi';
import { Conversation, Message } from '../../../../types';
import { CHAT_QUERY_KEYS, COMMON_QUERY_OPTIONS } from '../constants';

/**
 * Hook for fetching and managing messages for a specific conversation.
 * This hook is focused on data concerns only.
 */
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const hasValidId = !!conversationId && conversationId.trim() !== '';

  const {
    data: conversation,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: CHAT_QUERY_KEYS.conversation(conversationId),
    queryFn: () => chatApi.getConversation(conversationId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...COMMON_QUERY_OPTIONS,
    enabled: hasValidId,
  });

  const sendMessage = useMutation({
    mutationFn: ({ content }: { content: string }) => {
      // Don't send message if no valid conversation ID
      if (!hasValidId) {
        console.warn('Attempted to send message without valid conversation ID');
        return Promise.resolve({ user_message: {} as Message, agent_message: {} as Message });
      }
      
      return chatApi.sendMessage({ 
        conversationId, 
        content,
        // Update handler that updates the message in React Query cache
        onUpdate: (updatedMessage) => {
          console.log(`Message update received, id: ${updatedMessage.id}`);
          
          // Update conversations in React Query cache
          queryClient.setQueryData(
            CHAT_QUERY_KEYS.conversation(conversationId),
            (oldConversation: Conversation | undefined) => {
              if (!oldConversation) return oldConversation;
              
              // Replace the message with the updated version
              const updatedMessages = oldConversation.messages.map(msg => 
                msg.id === updatedMessage.id ? updatedMessage : msg
              );
              
              return {
                ...oldConversation,
                messages: updatedMessages,
                lastMessage: updatedMessage.id === oldConversation.lastMessage?.id 
                  ? updatedMessage 
                  : oldConversation.lastMessage
              };
            }
          );
        }
      });
    },
    onSuccess: (response: { user_message: Message; agent_message: Message }) => {
      // Don't update state if no valid conversation ID or empty response
      if (!hasValidId || !response.user_message || !response.agent_message) {
        return;
      }
      
      // Update conversations list with the new messages
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversation(conversationId),
        (oldConversation: Conversation | undefined) => {
          if (!oldConversation) return oldConversation;
          return {
            ...oldConversation,
            messages: [...oldConversation.messages, response.user_message, response.agent_message],
            lastMessage: response.agent_message,
            messageCount: oldConversation.messageCount + 2,
          };
        }
      );

      // Update conversations list
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversations,
        (oldData: Conversation[] | undefined) => oldData?.map(conv => 
          conv.id === conversationId 
            ? {
                ...conv,
                lastMessage: response.agent_message,
                messageCount: conv.messageCount + 2,
              }
            : conv
        )
      );
    },
  });

  return {
    conversation,
    messages: conversation?.messages || [],
    isLoading,
    error,
    refetch,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
  };
} 