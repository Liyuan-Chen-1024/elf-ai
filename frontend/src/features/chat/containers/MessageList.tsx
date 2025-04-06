import React, { useEffect, useRef } from 'react';
import { Message } from '../../../types';
import MessageListContent from '../components/MessageListContent';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  emptyStateMessage?: string;
  emptyStateSubmessage?: string;
}

/**
 * MessageList container component that handles:
 * - Auto-scrolling behavior to the latest message
 * - Tracking conversation changes
 * - Passing data down to the MessageListContent component
 */
const MessageList: React.FC<MessageListProps> = ({ 
  messages = [], 
  isLoading = false,
  emptyStateMessage = 'Start a new conversation',
  emptyStateSubmessage = 'Send a message to get started',
}) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const currentConversationId = messages[0]?.conversationId ?? null;
  
  // Auto-scroll to bottom when conversation changes
  useEffect(() => {
    if (conversationIdRef.current !== currentConversationId) {
      conversationIdRef.current = currentConversationId;
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [currentConversationId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleContainerRendered = (container: HTMLDivElement) => {
    messagesEndRef.current = container;
  };

  return (
    <MessageListContent
      messages={messages}
      isLoading={isLoading}
      emptyStateMessage={emptyStateMessage}
      emptyStateSubmessage={emptyStateSubmessage}
      onContainerRendered={handleContainerRendered}
    />
  );
};

export default MessageList; 