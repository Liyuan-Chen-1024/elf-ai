import { useState } from 'react';
import { useMessages } from './useMessages';

/**
 * Hook for message-related actions, adding error handling and business logic
 * on top of the basic useMessages data hook.
 */
export function useMessageActions(conversationId: string) {
  const {
    sendMessage: apiSendMessage,
    messages,
    conversation,
    isSending,
    isLoading,
    refetch,
  } = useMessages(conversationId);

  const [error, setError] = useState<string | null>(null);

  /**
   * Send a message with error handling
   */
  const sendMessage = async (content: string): Promise<boolean> => {
    setError(null);
    try {
      // Validate input
      if (!content?.trim()) {
        throw new Error('Message content cannot be empty');
      }

      if (!conversationId) {
        window.console.error('Cannot send message: No conversation ID');
        throw new Error('No conversation selected');
      }

      // Send message via API
      apiSendMessage({ conversationId, content });

      return true;
    } catch (err) {
      window.console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      return false;
    }
  };

  /**
   * Clear any message action errors
   */
  const clearError = () => {
    setError(null);
  };

  return {
    sendMessage,
    clearError,
    messages,
    conversation,
    error,
    isSending,
    isLoading,
    refetch,
  };
}
