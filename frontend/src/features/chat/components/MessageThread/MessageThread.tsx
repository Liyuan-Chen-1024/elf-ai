import { Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import type { Message, UUID } from '../../types';
import { MessageItem } from './MessageItem';
import MessageList from './MessageList';

// Define the props interface
interface MessageThreadProps {
  messages: Message[];
  onToggleThinking?: (messageId: UUID) => void;
  isStreaming?: boolean;
  streamingContent?: string;
}

export const MessageThread = ({
  messages,
  onToggleThinking,
  isStreaming = false,
  streamingContent = '',
}: MessageThreadProps) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const messageList = [...messages];

  if (isStreaming) {
    const streamingMessage: Message = {
      id: 'streaming',
      conversation_id: messages.length > 0 && messages[0] ? messages[0].conversation_id : '0',
      content: streamingContent,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      isEdited: false,
    };

    messageList.push(streamingMessage);
  }

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
      <MessageList messages={messageList} onToggleThinking={onToggleThinking} />
      <div ref={messagesEndRef} />
    </Box>
  );
}; 