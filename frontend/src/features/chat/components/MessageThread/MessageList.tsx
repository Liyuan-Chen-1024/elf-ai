import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useChat } from '../../hooks/useChat';
import { Box } from '@mui/material';
import { Message, UUID } from '../../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  onToggleThinking?: (messageId: UUID) => void;
}

const MessageList = ({ messages, onToggleThinking }: MessageListProps) => {
  const theme = useTheme();
  const { isLoading } = useChat();
  const messagesEndRef = useRef(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState('');

  // Enhanced deduplication that considers message content as well
  const uniqueMessages = useMemo(() => {
    const seenContent = new Map();
    return messages.filter((message, index) => {
      // We keep track of both ID and content to catch duplicates
      const key = `${message.role}-${message.id}`;
      const contentKey = `${message.role}-${message.content}`;
      
      // Check if we've seen this ID before
      const isIdDuplicate = seenContent.has(key);
      
      // For assistant messages, also check content to avoid same-content duplicates
      const isContentDuplicate = message.role === 'assistant' && 
        messages.some((m, i) => i < index && m.role === 'assistant' && m.content === message.content);
      
      // If neither is duplicate, keep the message
      if (!isIdDuplicate && !isContentDuplicate) {
        seenContent.set(key, true);
        return true;
      }
      
      return false;
    });
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [uniqueMessages]);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        overflowY: 'auto',
        p: 2,
        gap: 2,
      }}
    >
      <div>
        {uniqueMessages.map((message) => (
          <div key={String(message.id)}>
            <MessageItem
              message={message}
              onToggleThinking={onToggleThinking}
              isHighlighted={message.id === highlightedMessageId}
            />
          </div>
        ))}
      </div>
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList; 