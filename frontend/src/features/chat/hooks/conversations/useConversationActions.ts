import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from './useConversations';

/**
 * Hook for conversation-related actions with navigation and error handling.
 * This hook is focused on business logic for conversation manipulation.
 */
export function useConversationActions() {
  const navigate = useNavigate();
  const { 
    createConversation: apiCreateConversation, 
    deleteConversation: apiDeleteConversation,
    isCreating,
    isDeleting
  } = useConversations();
  
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new conversation and navigate to it
   */
  const createConversation = async () => {
    setError(null);
    try {
      const newConversation = await apiCreateConversation();
      if (newConversation?.id) {
        navigate(`/chat/${newConversation.id}`);
        return newConversation;
      } else {
        setError('Failed to create conversation - invalid response');
        return null;
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('Failed to create conversation. Please try again.');
      return null;
    }
  };

  /**
   * Delete a conversation and optionally navigate away if it's the active one
   */
  const deleteConversation = async (id: string, isActive: boolean = false) => {
    try {
      await apiDeleteConversation(id);
      // If we deleted the active conversation, navigate to the main chat route
      if (isActive) {
        navigate('/chat');
      }
      return true;
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('Failed to delete conversation. Please try again.');
      return false;
    }
  };

  /**
   * Clear any conversation action errors
   */
  const clearError = () => {
    setError(null);
  };

  return {
    createConversation,
    deleteConversation,
    clearError,
    error,
    isCreating,
    isDeleting
  };
} 