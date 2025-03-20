import { Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import type { Message, UUID } from '../../types';
import { MessageItem } from './MessageItem';
import MessageList from './MessageList';

// Define the props interface
interface MessageThreadProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  onEditMessage: (messageId: UUID, content: string) => void;
  clearError: () => void;
}

export const MessageThread = ({
  messages,
  isLoading,
  isStreaming,
  error,
  onEditMessage,
  clearError,
}: MessageThreadProps) => {
  const messagesEndRef = useRef(null);

  // Log props for debugging
  useEffect(() => {
    console.log('MessageThread received props:', {
      messages,
      isLoading,
      isStreaming,
      error,
      messagesLength: messages?.length,
      isMessagesArray: Array.isArray(messages),
    });
  }, [messages, isLoading, isStreaming, error]);

  // Clear error when component unmounts or when messages change
  useEffect(() => {
    return () => {
      if (error) {
        clearError();
      }
    };
  }, [error, clearError]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when new messages arrive or during streaming
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const messageList = [...(Array.isArray(messages) ? messages : [])];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <MessageList 
        messages={messageList} 
        onEditMessage={onEditMessage}
        isLoading={isLoading}
        isStreaming={isStreaming}
      />
      <div ref={messagesEndRef} />
    </Box>
  );
}; 