import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Message, UUID } from '../../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onMessageEdit?: (messageId: string, content: string) => void;
}

export const MessageList = ({ messages, isLoading, onMessageEdit }: MessageListProps) => {
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<UUID | null>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter out deleted messages and deduplicate by ID
  const uniqueMessages = messages.filter(
    (message) => !message.is_deleted
  ).reduce((acc: Message[], message) => {
    const existingIndex = acc.findIndex(m => m.id === message.id);
    if (existingIndex === -1) {
      return [...acc, message];
    }
    return acc;
  }, []);

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
          <Typography variant="body1" color="text.secondary">
            No messages yet. Start a conversation!
          </Typography>
        </Box>
      )}
      
      {uniqueMessages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onEdit={onMessageEdit ? (content) => onMessageEdit(message.id, content) : undefined}
          isHighlighted={message.id === highlightedMessageId}
          onHighlight={setHighlightedMessageId}
          isLoading={isLoading}
        />
      ))}
      
      {isLoading && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      )}
      
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList; 