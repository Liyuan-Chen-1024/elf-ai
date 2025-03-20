import React, { useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { Message } from '../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
}

export const MessageList = ({ 
  messages, 
  isLoading, 
  isStreaming
}: MessageListProps) => {
  const theme = useTheme();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Make sure messages is always an array
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Filter out deleted messages and deduplicate by ID
  const uniqueMessages = safeMessages.filter(
    (message) => !message.is_deleted && message.content?.trim().length > 0
  ).reduce((acc: Message[], message) => {
    const existingIndex = acc.findIndex(m => m.id === message.id);
    if (existingIndex === -1) {
      return [...acc, message];
    }
    return acc;
  }, []);

  // Determine if we need to show a thinking message
  const shouldShowThinking = isStreaming && uniqueMessages.length > 0;
  
  // Create a virtual thinking message for the assistant
  const thinkingMessage = shouldShowThinking ? {
    id: 'thinking-message',
    conversation_id: uniqueMessages.length > 0 ? uniqueMessages[0].conversation_id : 'temp',
    content: 'Thinking...',
    role: 'assistant',
    timestamp: new Date().toISOString(),
    sender: { id: 'assistant', name: 'Elf AI' },
    isThinking: true
  } : null;

  // Log unique messages for debugging
  useEffect(() => {
    if (uniqueMessages.length > 0) {
      console.log(`MessageList: Rendering ${uniqueMessages.length} messages`);
      
      // Check for messages without <think> tags
      const assistantMessages = uniqueMessages.filter(m => m.role === 'assistant' && !m.isThinking);
      const messagesWithoutThinking = assistantMessages.filter(m => !m.content.includes('<think>'));
      
      if (messagesWithoutThinking.length > 0) {
        console.log(`MessageList: ${messagesWithoutThinking.length} assistant messages without thinking tags`);
      }
    }
  }, [uniqueMessages]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        overflowY: 'auto',
        gap: 2,
        p: 2,
        bgcolor: theme.palette.background.default,
      }}
    >
      {uniqueMessages.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', my: 4 }}>
          <Typography variant="body1" component="div" color="text.secondary">
            No messages yet. Start a conversation!
          </Typography>
        </Box>
      )}
      
      {uniqueMessages.map((message) => (
        <MessageItem
          key={String(message.id)}
          message={message}
        />
      ))}
      
      {thinkingMessage && (
        <MessageItem
          key="thinking-message"
          message={thinkingMessage}
        />
      )}
      
      {isLoading && uniqueMessages.length === 0 && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography component="div" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      )}
      
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList; 