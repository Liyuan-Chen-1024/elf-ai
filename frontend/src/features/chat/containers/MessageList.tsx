import React from 'react';
import { Message } from '../../../types';
import MessageListContent from '../components/MessageListContent';
import { useMessageUI } from '../hooks/messages';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  emptyStateMessage?: string;
  emptyStateSubmessage?: string;
}

/**
 * MessageList container connects the message data to the presentation component
 * and provides UI-specific behavior through hooks.
 */
const MessageList: React.FC<MessageListProps> = ({
  messages = [],
  isLoading = false,
  emptyStateMessage = 'Start a new conversation',
  emptyStateSubmessage = 'Send a message to get started',
}) => {
  // Use the UI hook for scroll behavior
  const { handleScrollableRef } = useMessageUI(messages);

  // Simple pass-through to the content component
  return (
    <MessageListContent
      messages={messages}
      isLoading={isLoading}
      emptyStateMessage={emptyStateMessage}
      emptyStateSubmessage={emptyStateSubmessage}
      onContainerRendered={handleScrollableRef}
    />
  );
};

export default MessageList;
