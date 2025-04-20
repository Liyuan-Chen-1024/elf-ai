// Common query options
export const COMMON_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: false,
  retry: 1,
} as const;

// Query keys for React Query
export const CHAT_QUERY_KEYS = {
  conversations: ['conversations'],
  conversation: (id: string) => ['conversations', id],
} as const;
