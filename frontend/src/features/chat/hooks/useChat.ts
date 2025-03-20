import { useState, useEffect, useCallback, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Conversation, Message, UUID } from '../types';
import { messagesApi } from '../api/messages.api';
import { API_BASE_URL } from '../../../shared/api/api-client';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  isStreaming: boolean;
}

export const useChat = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const currentConversationIdRef = useRef<UUID | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await messagesApi.getConversations();
      console.log('Fetched conversations:', data);
      setConversations(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setError('Failed to fetch conversations');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCurrentConversation = useCallback(async () => {
    if (!currentConversationIdRef.current) return;
    
    try {
      const convId = currentConversationIdRef.current;
      console.log('Refreshing current conversation:', convId);
      
      const timestamp = new Date().getTime();
      const url = `${API_BASE_URL}/chat/conversations/${convId}/messages/?_=${timestamp}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching messages: ${response.status}`);
      }
      
      const messages = await response.json();
      console.log('Refreshed messages:', messages);
      
      if (convId === currentConversationIdRef.current) {
        setCurrentConversation(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            messages: [...messages],
          };
        });
      }
    } catch (error) {
      console.error('Error refreshing conversation:', error);
      if (currentConversation?.id === currentConversationIdRef.current) {
        setError('Failed to refresh conversation');
      }
    }
  }, [currentConversation]);

  const selectConversation = useCallback(async (conversation: Conversation | UUID) => {
    const convId = typeof conversation === 'object' ? conversation.id : conversation;
    
    if (currentConversationIdRef.current === convId) {
      console.log('Already on conversation:', convId);
      return;
    }
    
    currentConversationIdRef.current = convId;
    console.log('Selecting conversation:', convId);
    
    try {
      setIsLoading(true);
      
      if (typeof conversation === 'object' && conversation.messages) {
        setCurrentConversation(conversation);
      } else {
        const existingConv = conversations.find(c => c.id === convId);
        
        if (existingConv) {
          setCurrentConversation(existingConv);
        }
        
        const messages = await messagesApi.getMessages(convId);
        
        if (convId === currentConversationIdRef.current) {
          if (existingConv) {
            setCurrentConversation({
              ...existingConv,
              messages
            });
          } else {
            const convs = await fetchConversations();
            const freshConv = convs.find(c => c.id === convId);
            
            if (freshConv && convId === currentConversationIdRef.current) {
              setCurrentConversation({
                ...freshConv,
                messages
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to select conversation:', error);
      if (convId === currentConversationIdRef.current) {
        setError('Failed to load conversation');
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversations, fetchConversations]);

  const createConversation = useCallback(async (title: string) => {
    try {
      setIsLoading(true);
      
      const newConversation = await messagesApi.createConversation(title);
      
      const conversationWithMessages = {
        ...newConversation,
        messages: []
      };
      
      setConversations(prev => [...prev, conversationWithMessages]);
      
      currentConversationIdRef.current = conversationWithMessages.id;
      setCurrentConversation(conversationWithMessages);
      
      return conversationWithMessages;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      setError('Failed to create conversation');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConversation = useCallback(async (id: UUID) => {
    try {
      setIsLoading(true);
      
      await messagesApi.deleteConversation(id);
      
      setConversations(prev => prev.filter(c => c.id !== id));
      
      if (currentConversationIdRef.current === id) {
        currentConversationIdRef.current = null;
        setCurrentConversation(null);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      setError('Failed to delete conversation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const renameConversation = useCallback(async (id: UUID, title: string) => {
    try {
      setIsLoading(true);
      
      await messagesApi.renameConversation(id, title);
      
      setConversations(prev => 
        prev.map(c => c.id === id ? { ...c, title } : c)
      );
      
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => 
          prev ? { ...prev, title } : null
        );
      }
      
      return true;
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      setError('Failed to rename conversation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  const archiveConversation = useCallback(async (id: UUID) => {
    try {
      setIsLoading(true);
      
      await messagesApi.archiveConversation(id);
      
      await fetchConversations();
      
      return true;
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      setError('Failed to archive conversation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchConversations]);

  const editMessage = useCallback(async (messageId: UUID | string, content: string) => {
    if (!currentConversation) {
      setError('No conversation selected');
      return false;
    }
    
    // Find the message to check if it's from the user
    const message = currentConversation.messages.find(m => m.id === messageId);
    
    // Only allow editing user messages
    if (!message || message.role !== 'user') {
      console.error('Cannot edit assistant messages');
      setError('Only user messages can be edited');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      const updatedMessage = await messagesApi.updateMessage(messageId, content);
      
      setCurrentConversation(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: prev.messages.map(m => 
            m.id === messageId ? updatedMessage : m
          )
        };
      });
      
      return true;
    } catch (error) {
      console.error('Failed to edit message:', error);
      setError('Failed to edit message');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation]);

  const sendMessage = useCallback(async (content: string) => {
    if (!currentConversation) {
      console.error('Cannot send message: No conversation selected');
      return false;
    }
    
    const convId = currentConversation.id;
    const conversationRef = { ...currentConversation };
    
    try {
      setIsLoading(true);
      setError(null);
      setIsStreaming(true);
      
      console.log(`Sending message in conversation ${convId}:`, content);
      
      const tempUserMessage = {
        id: `temp-user-${Date.now()}`,
        conversation_id: convId,
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        sender: { id: 'user', name: 'You' },
        isEdited: false,
      };
      
      const tempAssistantMessage = {
        id: `temp-assistant-${Date.now()}`,
        conversation_id: convId,
        content: 'Thinking...',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        sender: { id: 'assistant', name: 'Elf Agent' },
        isEdited: false,
        isThinking: true,
      };
      
      if (currentConversationIdRef.current !== convId) {
        console.warn('Conversation changed before message could be sent');
        return false;
      }
      
      setCurrentConversation(prev => {
        if (!prev || prev.id !== convId) return prev;
        
        return {
          ...prev,
          messages: [...prev.messages, tempUserMessage, tempAssistantMessage]
        };
      });
      
      const assistantMessageId = tempAssistantMessage.id;
      let assistantResponse = '';
      
      const handleToken = (token: string) => {
        assistantResponse += token;
        
        if (currentConversationIdRef.current !== convId) return;
        
        setCurrentConversation(prev => {
          if (!prev || prev.id !== convId) return prev;
          
          return {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === assistantMessageId
                ? { ...msg, content: assistantResponse, isThinking: true }
                : msg
            )
          };
        });
      };
      
      const handleError = (error: string) => {
        console.error('Error streaming message:', error);
        
        if (currentConversationIdRef.current !== convId) return;
        
        setError(error);
        
        setCurrentConversation(prev => {
          if (!prev || prev.id !== convId) return prev;
          
          return {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === assistantMessageId
                ? { ...msg, content: `Error: ${error}`, isThinking: false }
                : msg
            )
          };
        });
        
        setIsLoading(false);
        setIsStreaming(false);
      };
      
      const handleComplete = async () => {
        console.log('Message streaming completed');
        
        if (currentConversationIdRef.current !== convId) return;
        
        setCurrentConversation(prev => {
          if (!prev || prev.id !== convId) return prev;
          
          return {
            ...prev,
            messages: prev.messages.map(msg => 
              msg.id === assistantMessageId
                ? { ...msg, content: assistantResponse, isThinking: false }
                : msg
            )
          };
        });
        
        setTimeout(() => {
          refreshCurrentConversation();
        }, 500);
        
        setIsLoading(false);
        setIsStreaming(false);
      };
      
      await messagesApi.streamMessage(
        convId,
        content,
        handleToken,
        handleError,
        handleComplete
      );
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (currentConversationIdRef.current === convId) {
        setError(error instanceof Error ? error.message : String(error));
        setIsLoading(false);
        setIsStreaming(false);
      }
      
      return false;
    }
  }, [currentConversation, refreshCurrentConversation]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    currentConversation,
    isLoading,
    error,
    isStreaming,
    fetchConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    archiveConversation,
    sendMessage,
    editMessage,
    clearError,
  };
}; 