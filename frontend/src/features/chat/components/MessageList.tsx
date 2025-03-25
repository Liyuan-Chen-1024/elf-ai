import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Avatar, LinearProgress } from '@mui/material';
import { Message } from '../../../types';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  streamedResponse: string;
}

function MessageList({ messages, isLoading, streamedResponse }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState<boolean>(messages.length === 0);

  // Update isEmpty when messages change
  useEffect(() => {
    setIsEmpty(messages.length === 0);
  }, [messages]);

  // Log messages in development mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.console.log('Messages in MessageList render:', messages?.length || 0, {
        messageIds: messages?.map(m => m.id).join(', '),
        firstMessageContent: messages?.[0]?.content?.substring(0, 30) || 'none'
      });
    }
  }, [messages]);

  // Scroll to bottom when messages change or when streaming completes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamedResponse]);

  // Force clean render when messages change
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.console.log('MessageList received new messages');
    }

    // Force DOM refresh when messages array changes
    const handler = window.requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return () => window.cancelAnimationFrame(handler);
  }, [messages]);

  // Handle message rendering with key based on id and content to force re-render when content changes
  const renderMessage = (message: Message, index: number) => {
    if (!message) {
      if (import.meta.env.DEV) {
        window.console.warn('Received undefined message in MessageList at index', index);
      }
      return null;
    }

    // Generate a stable key that forces re-render when content changes
    const messageKey = `${message.id}-${message.content?.length || 0}`;
    
    // Some messages might not have all fields properly defined,
    // so we'll set defaults to prevent rendering errors
    const role = message.role || 'assistant';
    const isUser = role === 'user';
    const sender = message.sender || { 
      name: isUser ? 'You' : 'Assistant', 
      avatar: isUser ? 'https://i.pravatar.cc/150?img=1' : 'https://i.pravatar.cc/150?img=2' 
    };
    const content = message.content || '';
    
    return (
      <Box 
        key={messageKey}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          mb: 3,
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: 1,
            mb: 1,
          }}
        >
          <Avatar 
            alt={sender.name}
            src={sender.avatar}
            sx={{ width: 36, height: 36 }}
          />
          <Typography variant="caption" color="text.secondary">
            {sender.name}
          </Typography>
        </Box>
        
        <Box
          className={`message-bubble ${isUser ? 'user' : 'assistant'}`}
          sx={{ 
            maxWidth: '80%',
            wordBreak: 'break-word',
            backgroundColor: isUser ? 'primary.light' : 'grey.100',
            color: isUser ? 'white' : 'text.primary',
            borderRadius: 2,
            p: 2,
          }}
        >
          {role === 'assistant' ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            content
          )}
        </Box>
        
        {message.isEdited && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            (edited)
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
        px: 2,
      }}
    >
      {isEmpty && !isLoading && !streamedResponse && (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            opacity: 0.7,
          }}
        >
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Start a new conversation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Send a message to get started
          </Typography>
        </Box>
      )}
      
      {/* Display existing messages */}
      {messages.map((message, index) => renderMessage(message, index))}
      
      {/* Display streamed response as it comes in */}
      {streamedResponse && (
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            mb: 3,
            alignItems: 'flex-start',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 1,
              mb: 1,
            }}
          >
            <Avatar 
              alt="Elf Agent"
              src="https://i.pravatar.cc/150?img=2"
              sx={{ width: 36, height: 36 }}
            />
            <Typography variant="caption" color="text.secondary">
              Elf Agent
            </Typography>
          </Box>
          
          <Box
            className="message-bubble assistant"
            sx={{ 
              maxWidth: '80%',
              wordBreak: 'break-word',
            }}
          >
            <ReactMarkdown>{streamedResponse}</ReactMarkdown>
          </Box>
        </Box>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}
      
      {/* Empty div for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </Box>
  );
}

export default MessageList; 