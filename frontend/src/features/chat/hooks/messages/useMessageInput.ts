import { useState, KeyboardEvent } from 'react';

/**
 * Hook for managing message input state and interactions.
 * Extracts business logic from the MessageInput component.
 */
export function useMessageInput(
  onSendMessage: (message: string) => void,
  isLoading: boolean = false
) {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isMessageEmpty = !message.trim();

  return {
    message,
    setMessage,
    handleSendMessage,
    handleKeyDown,
    isMessageEmpty,
  };
}
