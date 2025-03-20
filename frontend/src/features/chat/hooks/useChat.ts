import { useState, useEffect, useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Conversation, Message, UUID } from '../types';
import { messagesApi } from '../api/messages.api';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  lastTokens: string[];
  messages: Message[];
}

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    conversations: [],
    currentConversation: null,
    isLoading: false,
    error: null,
    lastTokens: [],
    messages: [],
  });

  const isStreamingRef = useRef(false);
  const currentAssistantMessageRef = useRef<Message | null>(null);
  const backendMessageIdRef = useRef<string>('');

  const updateConversations = useCallback((
    newConversations: Conversation[] | ((prev: Conversation[]) => Conversation[])
  ) => {
    setState((prev) => ({
      ...prev,
      conversations:
        typeof newConversations === 'function'
          ? newConversations(prev.conversations)
          : newConversations,
    }));
  }, []);

  const updateCurrentConversation = useCallback((conversation: Conversation | null) => {
    console.log('Updating current conversation:', {
      previous: state.currentConversation,
      new: conversation,
    });
    
    // Only update if the conversation has actually changed
    if (
      (!state.currentConversation && conversation) ||
      (state.currentConversation && !conversation) ||
      (state.currentConversation?.id !== conversation?.id) ||
      (state.currentConversation?.messages?.length !== conversation?.messages?.length)
    ) {
      setState((prev) => ({
        ...prev,
        currentConversation: conversation,
      }));
    }
  }, [state.currentConversation]);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  }, []);

  const setIsLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading,
    }));
  }, []);

  const setLastTokens = useCallback((lastTokens: string[]) => {
    setState((prev) => ({
      ...prev,
      lastTokens,
    }));
  }, []);

  const setMessages = useCallback((messages: Message[]) => {
    setState((prev) => ({
      ...prev,
      messages,
    }));
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const conversations = await messagesApi.getConversations();
      updateConversations(conversations);
    } catch (error) {
      setError('Failed to fetch conversations');
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, updateConversations, setError]);

  const selectConversation = useCallback(async (conversation: Conversation) => {
    console.log('Selecting conversation:', {
      conversation,
      currentId: state.currentConversation?.id,
    });
    
    // Only update if selecting a different conversation
    if (conversation.id !== state.currentConversation?.id) {
      try {
        setIsLoading(true);
        const messages = await messagesApi.getMessages(conversation.id);
        console.log('Fetched messages for conversation:', {
          conversationId: conversation.id,
          messageCount: messages.length,
          messages,
        });
        
        // Update the conversation with fetched messages
        const updatedConversation = {
          ...conversation,
          messages: messages,
        };
        
        // Update the conversations list with the new messages
        updateConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv.id === conversation.id ? updatedConversation : conv
          )
        );
        
        // Update the current conversation
        updateCurrentConversation(updatedConversation);
      } catch (error) {
        console.error('Failed to fetch messages for conversation:', error);
        setError('Failed to fetch messages');
      } finally {
        setIsLoading(false);
      }
    }
  }, [state.currentConversation?.id, setIsLoading, updateConversations, updateCurrentConversation, setError]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  /**
   * Send a message in the current conversation
   */
  const sendMessage = async (content: string) => {
    if (!state.currentConversation) {
      console.error('Cannot send message: No conversation selected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Sending message in conversation ${state.currentConversation.id}:`, content);
      
      // Create temporary user message that will show immediately
      const tempUserMessage = {
        id: `temp-user-${Date.now()}`,
        conversation_id: state.currentConversation.id,
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        sender: { id: 'user', name: 'You' },
        isEdited: false,
      };
      
      // Create a temporary assistant message that will be updated with streaming tokens
      const tempAssistantMessage = {
        id: `temp-assistant-${Date.now()}`,
        conversation_id: state.currentConversation.id,
        content: '',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        sender: { id: 'assistant', name: 'Elf Agent' },
        isEdited: false,
      };
      
      // Update the current conversation with the temporary messages
      const updatedConversation = {
        ...state.currentConversation,
        messages: [...state.currentConversation.messages, tempUserMessage, tempAssistantMessage],
      };
      
      // Update state to show the messages immediately
      updateCurrentConversation(updatedConversation);
      
      // Set up streaming handlers
      let assistantResponse = '';
      
      const handleToken = (token: string) => {
        console.log('Received token:', token);
        assistantResponse += token;
        
        // Update the assistant message with the current content
        const updatedMessages = updatedConversation.messages.map(msg => 
          msg.id === tempAssistantMessage.id 
            ? { ...msg, content: assistantResponse } 
            : msg
        );
        
        // Update the conversation with the new content
        updateCurrentConversation({
          ...updatedConversation,
          messages: updatedMessages,
        });
      };
      
      const handleError = (error: string) => {
        console.error('Error streaming message:', error);
        setError(error);
        setIsLoading(false);
      };
      
      const handleComplete = async () => {
        console.log('Message streaming completed');
        setIsLoading(false);
        
        // Refresh the conversation to get the actual messages with proper IDs
        if (state.currentConversation) {
          try {
            await fetchConversations();
            const refreshedConversations = await messagesApi.getConversations();
            const currentConversation = refreshedConversations.find(
              c => c.id === state.currentConversation?.id
            );
            
            if (currentConversation) {
              selectConversation(currentConversation);
            }
          } catch (error) {
            console.error('Error refreshing conversation after streaming:', error);
          }
        }
      };
      
      // Start streaming
      await messagesApi.streamMessage(
        state.currentConversation.id,
        content,
        handleToken,
        handleError,
        handleComplete
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : String(error));
      setIsLoading(false);
    }
  };

  const editMessage = async (messageId: UUID, content: string) => {
    if (!state.currentConversation) {
      setError('No conversation selected');
      return;
    }

    try {
      setIsLoading(true);
      const updatedMessage = await messagesApi.updateMessage(messageId, content);
      updateCurrentConversation({
        ...state.currentConversation,
        messages: state.currentConversation.messages.map((m) =>
          m.id === messageId ? updatedMessage : m
        ),
      });
    } catch (error) {
      setError('Failed to edit message');
      console.error('Failed to edit message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const archiveConversation = async (id: UUID) => {
    try {
      setIsLoading(true);
      await messagesApi.archiveConversation(id);
      const conversations = await messagesApi.getConversations();
      updateConversations(conversations);
      if (state.currentConversation?.id === id) {
        const archivedConversation = conversations.find(c => c.id === id);
        updateCurrentConversation(archivedConversation || null);
      }
    } catch (error) {
      setError('Failed to archive conversation');
      console.error('Failed to archive conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = useCallback(async (id: UUID) => {
    try {
      setIsLoading(true);
      console.log('Deleting conversation:', id);
      
      await messagesApi.deleteConversation(id);
      
      // Remove from conversations list
      updateConversations((prev) => prev.filter((conv) => conv.id !== id));
      
      // If this was the current conversation, clear it
      if (state.currentConversation?.id === id) {
        updateCurrentConversation(null);
      }
      
      console.log('Successfully deleted conversation:', id);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setError('Failed to delete conversation');
    } finally {
      setIsLoading(false);
    }
  }, [state.currentConversation?.id, setIsLoading, updateConversations, updateCurrentConversation, setError]);

  const renameConversation = async (id: UUID, title: string) => {
    try {
      setIsLoading(true);
      await messagesApi.renameConversation(id, title);
      const conversations = await messagesApi.getConversations();
      updateConversations(conversations);
      if (state.currentConversation?.id === id) {
        const renamedConversation = conversations.find(c => c.id === id);
        updateCurrentConversation(renamedConversation || null);
      }
    } catch (error) {
      setError('Failed to rename conversation');
      console.error('Failed to rename conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createConversation = useCallback(async (title: string) => {
    try {
      setIsLoading(true);
      console.log('Creating new conversation with title:', title);
      
      const newConversation = await messagesApi.createConversation(title);
      console.log('Created new conversation:', newConversation);
      
      // Initialize with empty messages array
      const conversationWithMessages = {
        ...newConversation,
        messages: [],
      };
      
      updateConversations((prev) => [...prev, conversationWithMessages]);
      updateCurrentConversation(conversationWithMessages);
      
      return conversationWithMessages;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setError('Failed to create conversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, updateConversations, updateCurrentConversation, setError]);

  return {
    ...state,
    fetchConversations,
    sendMessage,
    editMessage,
    archiveConversation,
    deleteConversation,
    renameConversation,
    createConversation,
    selectConversation,
    clearError,
    isStreaming: isStreamingRef.current,
  };
}; 