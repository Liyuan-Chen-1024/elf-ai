import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Avatar, Fade, Paper, alpha, CircularProgress, keyframes } from '@mui/material';
import { Message } from '../../../types';
import ReactMarkdown from 'react-markdown';

// Keyframes for avatar thinking animation
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(109, 90, 230, 0.4);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(109, 90, 230, 0);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(109, 90, 230, 0);
    transform: scale(1);
  }
`;

const float = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-3px);
  }
  100% {
    transform: translateY(0px);
  }
`;

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
          mb: 2.5,
          alignItems: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 1,
            mb: 0.5,
          }}
        >
          {!isUser && (
            <Avatar 
              alt={sender.name}
              src={sender.avatar}
              sx={{ 
                width: 32, 
                height: 32,
                border: '2px solid',
                borderColor: alpha('#6D5AE6', 0.2),
              }}
            />
          )}
          <Typography variant="caption" color="text.secondary">
            {sender.name}
          </Typography>
          {isUser && (
            <Avatar 
              alt={sender.name}
              src={sender.avatar}
              sx={{ 
                width: 32, 
                height: 32,
                border: '2px solid',
                borderColor: alpha('#6D5AE6', 0.2),
              }}
            />
          )}
        </Box>
        
        <Paper
          elevation={0}
          className={`message-bubble ${isUser ? 'user' : 'assistant'}`}
          sx={{ 
            maxWidth: '85%',
            wordBreak: 'break-word',
            p: 1.5,
            backgroundColor: isUser ? '#6D5AE6' : alpha('#FFFFFF', 0.7),
            color: isUser ? 'white' : '#1A1650',
            borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
            boxShadow: isUser 
              ? `0 2px 8px ${alpha('#6D5AE6', 0.3)}` 
              : `0 2px 8px ${alpha('#000', 0.05)}`,
            position: 'relative',
            '&::after': isUser ? {
              content: '""',
              position: 'absolute',
              bottom: 0,
              right: '-10px',
              width: 10,
              height: 16,
              backgroundColor: '#6D5AE6',
              borderBottomLeftRadius: 16,
            } : {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: '-10px',
              width: 10,
              height: 16,
              backgroundColor: alpha('#FFFFFF', 0.7),
              borderBottomRightRadius: 16,
            }
          }}
        >
          <ReactMarkdown>{content}</ReactMarkdown>
        </Paper>
      </Box>
    );
  };

  // Determine if we're in "thinking" mode
  const isThinking = isLoading || (streamedResponse === "Thinking...");
  // Show response bubble only if we have content beyond "Thinking..."
  const showResponseBubble = streamedResponse && !isThinking;

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
        px: { xs: 1, sm: 2 },
        py: 2,
        scrollBehavior: 'smooth'
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
      
      {/* Display thinking animation */}
      {isThinking && (
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2.5,
            ml: 1,
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Avatar 
              alt="Elf Agent"
              src="https://i.pravatar.cc/150?img=2"
              sx={{ 
                width: 38, 
                height: 38,
                border: '2px solid',
                borderColor: alpha('#6D5AE6', 0.3),
                animation: `${pulse} 2s infinite, ${float} 3s ease-in-out infinite`,
                zIndex: 2,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                backgroundColor: alpha('#6D5AE6', 0.05),
                animation: `${pulse} 2s infinite`,
                zIndex: 1,
              }}
            />
            <CircularProgress 
              size={50} 
              thickness={2}
              sx={{ 
                position: 'absolute',
                color: alpha('#6D5AE6', 0.4),
                animation: 'none',
              }} 
            />
          </Box>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              ml: 2, 
              fontStyle: 'italic',
              animation: `${float} 2s ease-in-out infinite`,
            }}
          >
            Thinking...
          </Typography>
        </Box>
      )}
      
      {/* Display streamed response as it comes in */}
      {showResponseBubble && (
        <Fade in={true} timeout={300}>
          <Box 
            sx={{
              display: 'flex',
              flexDirection: 'column',
              mb: 2.5,
              alignItems: 'flex-start',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 1,
                mb: 0.5,
              }}
            >
              <Avatar 
                alt="Elf Agent"
                src="https://i.pravatar.cc/150?img=2"
                sx={{ 
                  width: 32, 
                  height: 32,
                  border: '2px solid',
                  borderColor: alpha('#6D5AE6', 0.2),
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Elf Agent
              </Typography>
            </Box>
            
            <Paper
              elevation={0}
              className="message-bubble assistant"
              sx={{ 
                maxWidth: '85%',
                wordBreak: 'break-word',
                p: 1.5,
                backgroundColor: alpha('#FFFFFF', 0.7),
                borderRadius: '16px 16px 16px 0',
                boxShadow: `0 2px 8px ${alpha('#000', 0.05)}`,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '-10px',
                  width: 10,
                  height: 16,
                  backgroundColor: alpha('#FFFFFF', 0.7),
                  borderBottomRightRadius: 16,
                },
                animation: 'fadeIn 0.5s'
              }}
            >
              <ReactMarkdown>{streamedResponse}</ReactMarkdown>
            </Paper>
          </Box>
        </Fade>
      )}
      
      {/* Empty div for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </Box>
  );
}

export default MessageList; 