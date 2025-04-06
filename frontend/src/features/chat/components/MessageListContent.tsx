import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { Message } from '../../../types';
import UserMessage from './UserMessage';
import AgentMessage from './AgentMessage';
import EmptyState from './EmptyState';

interface MessageListContentProps {
  messages: Message[];
  isLoading: boolean;
  emptyStateMessage?: string;
  emptyStateSubmessage?: string;
  onContainerRendered?: (container: HTMLDivElement) => void;
}

/**
 * MessageListContent is a presentational component that renders message items.
 * It handles:
 * - Rendering the appropriate message component based on role
 * - Empty state display when no messages exist
 */
const MessageListContent: React.FC<MessageListContentProps> = ({ 
  messages = [], 
  isLoading = false,
  emptyStateMessage = 'Start a new conversation',
  emptyStateSubmessage = 'Send a message to get started',
  onContainerRendered
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current && onContainerRendered) {
      onContainerRendered(messagesEndRef.current);
    }
  }, [onContainerRendered]);

  return (
    <Box sx={{ 
      width: '100%',
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {(!messages.length && !isLoading) && (
        <EmptyState 
          message={emptyStateMessage} 
          submessage={emptyStateSubmessage} 
        />
      )}
      
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        {messages.map((message) => {
          switch (message.role) {
            case 'user':
              return <UserMessage key={`user-${message.id}`} message={message} />;
            case 'agent':
              return <AgentMessage key={`agent-${message.id}`} message={message} />;
            default:
              return null;
          }
        })}

        <div ref={messagesEndRef} style={{ float: 'left', clear: 'both' }} />
      </Box>
    </Box>
  );
};

export default MessageListContent; 