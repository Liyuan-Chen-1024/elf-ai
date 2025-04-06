import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../../../../services/chatApi';
import { Conversation } from '../../../../types';
import { CHAT_QUERY_KEYS, COMMON_QUERY_OPTIONS } from '../constants';

/**
 * Hook for managing conversation data fetching and basic API operations.
 * This hook is focused on data concerns only, without navigation/UI logic.
 */
export function useConversations() {
  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: CHAT_QUERY_KEYS.conversations,
    queryFn: chatApi.getConversations,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...COMMON_QUERY_OPTIONS,
  });

  const createConversation = useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: (newConversation: Conversation) => {
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversations,
        (oldData: Conversation[] | undefined) => [newConversation, ...(oldData || [])]
      );
    },
  });

  const deleteConversation = useMutation({
    mutationFn: chatApi.deleteConversation,
    onSuccess: (id: string) => {
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.conversations,
        (oldData: Conversation[] | undefined) => oldData?.filter(conv => conv.id !== id)
      );
    },
  });

  return {
    conversations,
    isLoading,
    error,
    refetch,
    createConversation: createConversation.mutateAsync,
    isCreating: createConversation.isPending,
    deleteConversation: deleteConversation.mutate,
    isDeleting: deleteConversation.isPending,
  };
} 