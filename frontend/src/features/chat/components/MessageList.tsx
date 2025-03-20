import { useEffect, useRef, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Message } from '../types';
import { MessageItem } from './MessageThread/MessageItem';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isThinking?: boolean;
  onMessageEdit?: (messageId: string, content: string) => void;
}

export const MessageList = ({ 
  messages, 
  isLoading, 
  isThinking,
  onMessageEdit 
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom when messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Slightly delay scrolling to ensure the DOM has updated
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Process messages to remove duplicates and thinking states that have been replaced
  const processedMessages = useMemo(() => {
    console.log('Processing messages:', messages?.length || 0);
    
    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      return [];
    }
    
    // First, ensure all messages are from the same conversation (prevent mixing)
    if (messages.length > 0) {
      const firstConversationId = messages[0].conversation_id;
      const allFromSameConv = messages.every(
        msg => msg.conversation_id === firstConversationId
      );
      
      if (!allFromSameConv) {
        console.warn('MessageList received messages from different conversations');
        
        // Get the most common conversation ID
        const convCounts = messages.reduce((counts, msg) => {
          counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
          return counts;
        }, {} as Record<string, number>);
        
        const mainConvId = Object.entries(convCounts)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        // Filter to only include messages from the most common conversation
        const filteredMessages = messages.filter(
          msg => msg.conversation_id === mainConvId
        );
        
        console.log(`Filtered out messages from other conversations. Kept ${filteredMessages.length} messages.`);
        
        // Continue processing with the filtered list
        messages = filteredMessages;
      }
    }
    
    // Group messages by sender sequence to handle multi-message sequences
    const messageGroups: Record<string, Message[]> = {};
    
    // Sort messages by timestamp to ensure proper ordering
    const sortedMessages = [...messages].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
    
    // Group by conversation_id, role, and message block
    // This creates "conversation turns" even with multiple messages from the same sender
    let lastSenderId = '';
    let blockCounter = 0;
    
    sortedMessages.forEach(msg => {
      const senderId = `${msg.conversation_id}-${msg.role}`;
      
      // If this is a new sender, increment the block counter
      if (senderId !== lastSenderId) {
        blockCounter++;
        lastSenderId = senderId;
      }
      
      const key = `${senderId}-${blockCounter}`;
      
      if (!messageGroups[key]) {
        messageGroups[key] = [];
      }
      messageGroups[key].push(msg);
    });
    
    // Filter out duplicate messages and thinking states
    const finalMessages: Message[] = [];
    
    Object.values(messageGroups).forEach(group => {
      if (group.length === 0) return;
      
      // Sort group by timestamp, newest first
      const sortedGroup = [...group].sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      // Prefer non-thinking messages over thinking messages
      const nonThinkingMsg = sortedGroup.find(msg => !msg.isThinking);
      
      if (nonThinkingMsg) {
        // Use the most recent non-thinking message
        finalMessages.push(nonThinkingMsg);
      } else {
        // If all are thinking messages, use the most recent one
        finalMessages.push(sortedGroup[0]);
      }
    });
    
    // Re-sort by timestamp for proper display order
    return finalMessages.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [messages]);

  // Filter out deleted messages
  const visibleMessages = processedMessages.filter(msg => !msg.is_deleted);

  return (
    <Box 
      sx={{ 
        p: 2, 
        overflowY: 'auto', 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {visibleMessages.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', my: 4, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No messages yet. Start a conversation!
          </Typography>
        </Box>
      )}

      {visibleMessages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          onEdit={onMessageEdit ? (content) => onMessageEdit(String(message.id), content) : undefined}
        />
      ))}

      {isLoading && visibleMessages.length === 0 && (
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Loading conversation...
          </Typography>
        </Box>
      )}
      
      <div ref={messagesEndRef} />
    </Box>
  );
}; 