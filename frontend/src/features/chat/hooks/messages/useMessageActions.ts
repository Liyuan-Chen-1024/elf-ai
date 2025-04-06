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
    refetch
  } = useMessages(conversationId);
  
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a message with error handling
   */
  const sendMessage = async (content: string) => {
    if (!content.trim()) {
      setError('Message cannot be empty');
      return false;
    }
    
    setError(null);
    try {
      apiSendMessage({ content });
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
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
    refetch
  };
} 