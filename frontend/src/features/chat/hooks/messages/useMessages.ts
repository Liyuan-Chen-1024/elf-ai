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
    enabled: !!conversationId,
  });

  const sendMessage = useMutation({
    mutationFn: ({ content }: { content: string }) => {
      return chatApi.sendMessage({ 
        conversationId, 
        content,
        onStream: (chunk: string) => {
          // When streaming is complete, refetch the conversation
          if (chunk === '[DONE]') {
            console.log('Streaming complete, refetching conversation');
            queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.conversation(conversationId) });
            return;
          }

          // During streaming, update the generating message's content
          queryClient.setQueryData(
            CHAT_QUERY_KEYS.conversation(conversationId),
            (oldConversation: Conversation | undefined) => {
              if (!oldConversation) return oldConversation;
              
              // Create a new message array
              const updatedMessages = oldConversation.messages.map(msg => {
                if (msg.is_generating) {
                  return {
                    ...msg,
                    content: (msg.content || '') + chunk
                  };
                }
                return msg;
              });
              
              // Also update lastMessage if it's generating
              const lastMessage = oldConversation.lastMessage;
              const updatedLastMessage = lastMessage?.is_generating 
                ? { ...lastMessage, content: (lastMessage.content || '') + chunk }
                : lastMessage;
                
              // Return a new conversation object
              return {
                ...oldConversation,
                messages: updatedMessages,
                lastMessage: updatedLastMessage
              };
            }
          );
        }
      });
    },
    onSuccess: (response: { user_message: Message; agent_message: Message }) => {
      // Initial update with both messages from the API
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