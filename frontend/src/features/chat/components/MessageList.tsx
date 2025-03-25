import React, { useEffect, useRef } from 'react';
import { Box, Typography, Avatar, CircularProgress, keyframes } from '@mui/material';
import { Message } from '../../../types';

// Import avatars
import userAvatar from '../../../assets/avatars/human-user.svg';
import assistantAvatar from '../../../assets/avatars/elf-robot.svg';

// Constants
const THEME = {
  colors: {
    primary: {
      main: '#7C4DFF',
      light: '#9D7FFF',
      gradient: 'linear-gradient(135deg, #7C4DFF 0%, #9D7FFF 100%)',
    },
    text: {
      primary: '#1C1C1E',
      secondary: '#6C6C70',
    },
    background: {
      user: 'linear-gradient(135deg, #7C4DFF 0%, #9D7FFF 100%)',
      assistant: 'rgba(255, 255, 255, 0.7)',
      container: '#FFFFFF',
      header: 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 100%)',
      headerBorder: 'linear-gradient(90deg, transparent, rgba(124, 77, 255, 0.08), transparent)',
    }
  },
  avatars: {
    user: userAvatar,
    assistant: assistantAvatar,
  },
  animations: {
    pulse: keyframes`
      0% { box-shadow: 0 0 0 0 rgba(124, 77, 255, 0.3); transform: scale(1); }
      70% { box-shadow: 0 0 0 12px rgba(124, 77, 255, 0); transform: scale(1.05); }
      100% { box-shadow: 0 0 0 0 rgba(124, 77, 255, 0); transform: scale(1); }
    `,
    float: keyframes`
      0% { transform: translateY(0px); }
      50% { transform: translateY(-4px); }
      100% { transform: translateY(0px); }
    `,
    blink: keyframes`
      0%, 100% { opacity: 0.8; }
      50% { opacity: 0.2; }
    `,
    shimmer: keyframes`
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    `
  }
};

// Types
interface AgentResponseHeaderProps {
  name: string;
  avatar: string;
  timestamp?: string;
  status?: 'thinking' | 'streaming' | 'completed' | 'error';
  reasoning?: string | null | undefined;
}

interface MessageItemComponentProps {
  message: Message;
}

interface MessageBubbleProps {
  isUser: boolean;
  content: string;
  isStreaming?: boolean;
}

interface EmptyStateProps {
  message: string;
  submessage: string;
}

// Styled components
const MessageContainer = ({ _isUser, children }: { _isUser: boolean; children: React.ReactNode }) => (
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    mb: 2,
    width: '100%',
    '&:last-child': {
      mb: 0,
    },
  }}>
    {children}
  </Box>
);

const AgentResponseHeader: React.FC<AgentResponseHeaderProps> = ({ 
  name, 
  avatar, 
  timestamp,
  status = 'completed',
  reasoning,
}) => {
  const isThinking = status === 'thinking';
  const statusText = {
    thinking: 'Thinking...',
    streaming: 'Generating response...',
    completed: 'Completed',
    error: 'Error occurred',
  }[status];

  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-start',
      mb: 1,
      ml: 2,
    }}>
      <Box sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Avatar 
          alt={name}
          src={avatar}
          sx={{ 
            width: 32,
            height: 32,
            backgroundColor: 'rgba(124, 77, 255, 0.04)',
            border: '1.5px solid rgba(124, 77, 255, 0.12)',
            ...(isThinking && {
              animation: `${THEME.animations.pulse} 2s infinite, ${THEME.animations.float} 3s ease-in-out infinite`,
            }),
          }}
        />
        {isThinking && (
          <CircularProgress 
            size={40} 
            thickness={1.5}
            sx={{ 
              position: 'absolute',
              color: 'rgba(124, 77, 255, 0.12)',
              animation: 'none',
            }} 
          />
        )}
      </Box>
      <Box sx={{ flex: 1, ml: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: '#1C1C1E',
              fontWeight: 600,
              fontSize: '0.875rem',
              letterSpacing: '-0.01em',
            }}
          >
            {name}
          </Typography>
          {timestamp && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(28, 28, 30, 0.5)',
                fontSize: '0.75rem',
              }}
            >
              {new Date(timestamp).toLocaleTimeString()}
            </Typography>
          )}
        </Box>
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          mt: 0.25,
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: status === 'error' ? '#FF4D4D' : '#6C6C70',
              fontStyle: 'italic',
              fontSize: '0.75rem',
              ...(isThinking && {
                animation: `${THEME.animations.float} 3s ease-in-out infinite`,
              }),
            }}
          >
            {statusText}
          </Typography>
          {status === 'streaming' && (
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                width: '0.4em',
                height: '0.8em',
                backgroundColor: '#6C6C70',
                marginLeft: 1,
                animation: `${THEME.animations.blink} 1s step-end infinite`,
              }}
            />
          )}
        </Box>
        {reasoning && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              color: 'rgba(28, 28, 30, 0.65)',
              fontSize: '0.75rem',
              mt: 0.5,
              fontStyle: 'italic',
            }}
          >
            {reasoning.replace('#### Thinking Process:', '').trim()}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const MessageBubble = ({ isUser, content = '', isStreaming = false }: MessageBubbleProps) => {
  // Extract reasoning if present, but keep the main content intact
  let messageContent = content;
  let reasoningText: string | null = null;

  if (messageContent?.startsWith('#### Thinking Process:')) {
    const parts = messageContent.split(/^(?:#{4} .*\n)/m);
    reasoningText = parts[0]?.trim() || null;
    messageContent = parts[1] || '';
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      pr: isUser ? { xs: 2, sm: 3 } : 0,
    }}>
      {!isUser && (
        <AgentResponseHeader 
          name="Elf Agent"
          avatar={THEME.avatars.assistant}
          status={isStreaming ? 'streaming' : 'completed'}
          reasoning={reasoningText}
          timestamp={new Date().toISOString()}
        />
      )}

      {/* Message content */}
      <Box sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        width: '100%',
        pl: !isUser ? 6 : 0,
      }}>
        <Box 
          sx={{
            wordBreak: 'break-word',
            p: { xs: 2, sm: 2.5 },
            background: isUser ? 'rgba(124, 77, 255, 0.1)' : 'rgba(248, 249, 250, 0.8)',
            color: '#1C1C1E',
            borderRadius: '12px',
            width: isUser ? 'auto' : '100%',
            maxWidth: '85%',
            position: 'relative',
            border: '1px solid',
            borderColor: isUser ? 'rgba(124, 77, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          }}
        > 
          <Typography 
            component="div" 
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontFamily: isStreaming ? 'monospace' : 'inherit',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              letterSpacing: '-0.01em',
            }}
          >
            {messageContent}
            {isStreaming && (
              <Box
                component="span"
                sx={{
                  display: 'inline-block',
                  width: '0.5em',
                  height: '1.2em',
                  backgroundColor: 'currentColor',
                  marginLeft: '2px',
                  verticalAlign: 'middle',
                  animation: `${THEME.animations.blink} 1s step-end infinite`,
                }}
              />
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const EmptyState = ({ message, submessage }: EmptyStateProps) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center',
    flex: 1,
    minHeight: 0,
    py: 4,
  }}>
    <Typography 
      variant="h5" 
      sx={{ 
        color: '#1C1C1E',
        fontWeight: 600,
        fontSize: '1.25rem',
        letterSpacing: '-0.02em',
        mb: 1,
      }}
    >
      {message}
    </Typography>
    <Typography 
      variant="body2" 
      sx={{ 
        color: '#6C6C70',
        fontSize: '0.9375rem',
      }}
    >
      {submessage}
    </Typography>
  </Box>
);

// Components
const MessageItem = ({ message, isStreaming = false }: MessageItemComponentProps & { isStreaming?: boolean }) => {
  if (!message) return null;

  const isUser = message.role === 'user';

  return (
    <MessageContainer _isUser={isUser}>
      <MessageBubble 
        isUser={isUser} 
        content={message.content} 
        isStreaming={isStreaming}
      />
    </MessageContainer>
  );
};

// Main component
interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  streamedResponse: string;
  emptyStateMessage?: string;
  emptyStateSubmessage?: string;
  agentName?: string;
  agentAvatar?: string;
}

/**
 * MessageList Component
 * 
 * Displays a list of messages in a chat-like interface with support for:
 * - User and assistant messages
 * - Loading/thinking state
 * - Streamed responses
 * - Empty state
 * - Auto-scrolling
 * 
 * @param props MessageListProps
 */
function MessageList({ 
  messages, 
  isLoading, 
  streamedResponse,
  emptyStateMessage = 'Start a new conversation',
  emptyStateSubmessage = 'Send a message to get started',
  agentName = 'Elf Agent',
  agentAvatar = THEME.avatars.assistant
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isEmpty = messages.length === 0;
  
  const isActivelyStreaming = streamedResponse && streamedResponse !== "Thinking...";
  const showThinking = isLoading && !isActivelyStreaming;

  // Scroll to bottom whenever messages, streaming, or loading state changes
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        window.requestAnimationFrame(() => {
          try {
            messagesEndRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'end'
            });
          } catch (_error) {
            // Fallback if smooth scroll fails
            messagesEndRef.current?.scrollIntoView(false);
          }
        });
      }
    };

    // Initial scroll
    scrollToBottom();

    // Set up a small delay to handle dynamic content
    const timeoutId = window.setTimeout(scrollToBottom, 100);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [messages, streamedResponse, isLoading]);

  // Development logging
  useEffect(() => {
    if (import.meta.env.DEV) {
      window.console.log('Messages in MessageList:', {
        count: messages?.length || 0,
        messageIds: messages?.map(m => m.id).join(', '),
        firstMessage: messages?.[0]?.content?.substring(0, 30) || 'none'
      });
    }
  }, [messages]);

  return (
    <Box sx={{ 
      width: '100%',
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {isEmpty && !isLoading && !streamedResponse && (
        <EmptyState 
          message={emptyStateMessage} 
          submessage={emptyStateSubmessage} 
        />
      )}
      
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Show user messages immediately */}
        {messages.map((message) => (
          <MessageItem 
            key={message.id}
            message={message} 
          />
        ))}
        
        {/* Show streaming response */}
        {isActivelyStreaming && (
          <MessageItem 
            message={{
              id: 'stream',
              role: 'agent',
              content: streamedResponse,
              sender: {
                id: 'agent'
              },
              conversationId: 'stream',
              timestamp: new Date().toISOString(),
              isEdited: false
            }}
            isStreaming={true}
          />
        )}
        
        {/* Show thinking state */}
        {showThinking && (
          <AgentResponseHeader 
            name={agentName}
            avatar={agentAvatar}
            status="thinking"
          />
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} style={{ float: 'left', clear: 'both', height: 1 }} />
      </Box>
    </Box>
  );
}

export default MessageList; 