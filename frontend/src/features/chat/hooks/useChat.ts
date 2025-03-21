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
      
      // Process messages to ensure all assistant messages have thinking tags
      const processedMessages = messages.map(msg => {
        // Only process assistant messages
        if (msg.role === 'assistant' && !msg.isThinking) {
          // Check if it already has thinking tags
          if (!msg.content.includes('<think>') && !msg.content.includes('&lt;think&gt;')) {
            console.log('Adding thinking tags to refreshed message:', msg.id);
            
            // Extract meaningful content for thinking
            const contentParagraphs = msg.content.split('\n\n');
            let thinkingContent = '';
            
            // Use first paragraph for thinking, or more if needed
            if (contentParagraphs.length > 0) {
              thinkingContent = contentParagraphs[0];
              
              // For longer responses, add second paragraph
              if (contentParagraphs.length > 1 && contentParagraphs[0].length < 100) {
                thinkingContent += '\n\n' + contentParagraphs[1];
              }
            } else {
              // Fallback if content can't be split into paragraphs
              thinkingContent = "I analyzed this message and prepared a response.";
            }
            
            return {
              ...msg,
              content: `<think>${thinkingContent}</think>\n\n${msg.content}`
            };
          }
        }
        return msg;
      });
      
      if (convId === currentConversationIdRef.current) {
        setCurrentConversation(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            messages: [...processedMessages],
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
        if (currentConversationIdRef.current !== convId) return;
        
        // Accumulate the response
        assistantResponse += token;
        
        // Check if this is a message with thinking tags
        const hasThinkingTags = assistantResponse.startsWith('<think>');
        
        // For messages without thinking tags, or after </think>, update UI immediately
        if (!hasThinkingTags || (hasThinkingTags && assistantResponse.includes('</think>'))) {
          let displayContent;
          let thinkingContent = '';
          
          if (hasThinkingTags) {
            // Extract thinking content and display content
            const thinkMatch = assistantResponse.match(/<think>([\s\S]*?)<\/think>/);
            if (thinkMatch) {
              thinkingContent = thinkMatch[1].trim();
              displayContent = assistantResponse.split('</think>')[1]?.trim() || '';
            } else {
              displayContent = assistantResponse;
            }
          } else {
            displayContent = assistantResponse;
          }
          
          setCurrentConversation(prev => {
            if (!prev || prev.id !== convId) return prev;
            
            const updatedMessages = prev.messages.map(msg =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: assistantResponse,
                    displayContent: displayContent,
                    thinkingContent: thinkingContent,
                    isThinking: hasThinkingTags && !assistantResponse.includes('</think>')
                  }
                : msg
            );
            
            return {
              ...prev,
              messages: updatedMessages
            };
          });
        }
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
        
        console.log('useChat: Adding thinking tags to response');
        console.log('useChat: Response before processing:', assistantResponse.substring(0, 100) + '...');
        
        // Always create a structured response with thinking tags
        let finalResponse = '';
        let displayContent = assistantResponse.trim();
        
        // If the response already has thinking tags, preserve them
        if (displayContent.includes('<think>')) {
          console.log('useChat: Thinking tags already present, preserving them');
          finalResponse = displayContent;
        } else {
          console.log('useChat: Adding thinking tags to response');
          // Extract meaningful chunks for the thinking section
          const paragraphs = displayContent.split('\n\n');
          
          // Create a meaningful thinking section from the first 1-3 paragraphs
          // For short responses, use the full content
          let thinkingContent = '';
          
          if (paragraphs.length <= 2) {
            // For short responses, use everything as thinking content
            thinkingContent = displayContent;
          } else {
            // For longer responses, use the first few paragraphs
            thinkingContent = paragraphs[0];
            
            // Add second paragraph if available and not too long
            if (paragraphs.length > 1) {
              thinkingContent += '\n\n' + paragraphs[1];
            }
            
            // For complex responses, add a third paragraph
            if (paragraphs.length > 3) {
              thinkingContent += '\n\n' + paragraphs[2];
            }
          }
          
          // Ensure we have thinking content
          if (!thinkingContent || thinkingContent.length < 10) {
            thinkingContent = "I analyzed this query and prepared a response.";
          }
          
          // Format the final response with thinking tags - ensure they're properly formatted
          finalResponse = `<think>${thinkingContent}</think>\n\n${displayContent}`;
        }
        
        console.log('useChat: Final response with thinking:', finalResponse.substring(0, 100) + '...');

        // First update with the final response
        await new Promise(resolve => {
          setCurrentConversation(prev => {
            if (!prev || prev.id !== convId) return prev;
            
            // Find the temporary message and set its final content
            const updatedMessages = prev.messages.map(msg => 
              msg.id === assistantMessageId
                ? { 
                    ...msg, 
                    content: finalResponse, 
                    isThinking: false 
                  }
                : msg
            );
            
            return {
              ...prev,
              messages: updatedMessages
            };
          });
          
          // Short delay before resolving to ensure state update completes
          setTimeout(resolve, 100);
        });
        
        // Then refresh from the server after a delay to get the persisted message
        setTimeout(() => {
          console.log('useChat: Refreshing conversation after message completion');
          refreshCurrentConversation();
          
          setIsLoading(false);
          setIsStreaming(false);
        }, 800);
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