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
}

export const useChat = () => {
  const [state, setState] = useState({
    conversations: [],
    currentConversation: null,
    isLoading: false,
    error: null,
    lastTokens: [],
  });

  const isStreamingRef = useRef(false);
  const currentAssistantMessageRef = useRef(null);
  const backendMessageIdRef = useRef('');
  const [, forceUpdate] = useState({});

  const updateConversations = (
    newConversations: Conversation[] | ((prev: Conversation[]) => Conversation[])
  ) => {
    setState((prev) => ({
      ...prev,
      conversations:
        typeof newConversations === 'function'
          ? newConversations(prev.conversations)
          : newConversations,
    }));
  };

  const updateCurrentConversation = (conversation: Conversation | null) => {
    setState((prev) => ({
      ...prev,
      currentConversation: conversation,
    }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
    }));
  };

  const setIsLoading = (isLoading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading,
    }));
  };

  const setLastTokens = (lastTokens: string[]) => {
    setState((prev) => ({
      ...prev,
      lastTokens,
    }));
  };

  const fetchConversations = async () => {
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
  };

  const sendMessage = async (content: string) => {
    if (!state.currentConversation) {
      setError('No conversation selected');
      return;
    }

    try {
      setIsLoading(true);
      const userMessage: Message = {
        id: 'temp-user-message',
        conversation_id: state.currentConversation.id,
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
      };

      const assistantMessage: Message = {
        id: 'temp-assistant-message',
        conversation_id: state.currentConversation.id,
        content: '',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      updateCurrentConversation({
        ...state.currentConversation,
        messages: [...state.currentConversation.messages, userMessage, assistantMessage],
      });

      currentAssistantMessageRef.current = assistantMessage;
      isStreamingRef.current = true;

      const streamHandler = messagesApi.streamMessage(
        state.currentConversation.id,
        content,
        (token) => {
          if (currentAssistantMessageRef.current) {
            currentAssistantMessageRef.current.content += token;
            forceUpdate({});
          }
        },
        (error) => {
          setError(error);
          isStreamingRef.current = false;
        },
        () => {
          isStreamingRef.current = false;
        }
      );

      await streamHandler;
    } catch (error) {
      setError('Failed to send message');
      console.error('Failed to send message:', error);
    } finally {
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

  const deleteConversation = async (id: UUID) => {
    try {
      setIsLoading(true);
      await messagesApi.deleteMessage(id);
      updateConversations((prev) => prev.filter((c) => c.id !== id));
      if (state.currentConversation?.id === id) {
        updateCurrentConversation(null);
      }
    } catch (error) {
      setError('Failed to delete conversation');
      console.error('Failed to delete conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const clearError = () => {
    setError(null);
  };

  return {
    ...state,
    fetchConversations,
    sendMessage,
    editMessage,
    archiveConversation,
    deleteConversation,
    renameConversation,
    clearError,
    isStreaming: isStreamingRef.current,
  };
}; 