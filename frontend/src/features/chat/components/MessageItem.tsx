import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Avatar, IconButton, Paper, Button, Collapse } from '@mui/material';
import { styled } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ReactMarkdown from 'react-markdown';
import { CircularProgress } from '@mui/material';

// Message bubble with subtle shadow and rounded corners
const MessageBubble = styled(Paper)(({ theme, ownerState }) => ({
  padding: theme.spacing(2, 3),
  borderRadius: theme.spacing(2),
  maxWidth: '100%',
  marginBottom: theme.spacing(1),
  boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px, rgba(0, 0, 0, 0.1) 0px 1px 3px',
  backgroundColor: ownerState.isUser 
    ? theme.palette.grey[100] 
    : ownerState.isThinking 
      ? 'rgba(144, 202, 249, 0.15)' 
      : 'rgba(144, 202, 249, 0.2)', 
  color: theme.palette.text.primary,
  transition: 'all 0.2s ease',
}));

// Custom styled avatar
const StyledAvatar = styled(Avatar)(({ theme, ownerState }) => ({
  width: 40,
  height: 40,
  background: ownerState.isUser 
    ? 'linear-gradient(135deg, #0052D4, #4364F7)' // Blue gradient for user
    : 'linear-gradient(135deg, #FF5F6D, #FFC371)', // Orange gradient for agent
  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px',
  color: '#fff',
}));

// Action buttons container
const ActionButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  marginTop: theme.spacing(0.5),
  '&:hover': {
    opacity: 1,
  },
}));

// Show thinking toggle button
const ThinkingToggle = styled(Button)(({ theme }) => ({
  fontSize: '0.75rem',
  textTransform: 'none',
  padding: theme.spacing(0.5, 1.5),
  borderRadius: 16,
  marginTop: theme.spacing(1),
  backgroundColor: 'rgba(0, 0, 0, 0.04)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
}));

// Thinking process container
const ThinkingProcess = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(0, 0, 0, 0.03)',
  border: '1px solid rgba(0, 0, 0, 0.05)',
}));

// Thinking animation words
const THINKING_WORDS = [
  'Analyzing',
  'Processing',
  'Evaluating',
  'Considering',
  'Thinking about'
];

/**
 * Simple message item component for chat
 */
export function MessageItem(props) {
  const { message, isThinking = false } = props;
  const [showThinking, setShowThinking] = useState(false);
  const [thinkingWord, setThinkingWord] = useState(THINKING_WORDS[0]);
  const intervalRef = useRef(null);
  
  // Rotate thinking words for animation
  useEffect(() => {
    if (isThinking) {
      intervalRef.current = setInterval(() => {
        setThinkingWord(prev => {
          const currentIndex = THINKING_WORDS.indexOf(prev);
          const nextIndex = (currentIndex + 1) % THINKING_WORDS.length;
          return THINKING_WORDS[nextIndex];
        });
      }, 2000);
      
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isThinking]);
  
  // Extract content from message
  const processMessageContent = (content) => {
    let displayContent = content || '';
    let thinkingContent = '';
    let hasThinkingTags = false;
    
    try {
      // Check if message starts with thinking tags
      hasThinkingTags = displayContent.startsWith('<think>');
      
      // Look for <think> tags
      const thinkMatch = displayContent.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) {
        thinkingContent = thinkMatch[1].trim();
        // Remove think tags from display content
        displayContent = displayContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
      } else {
        // If no thinking tags, use the display content as is
        displayContent = content;
      }
    } catch (error) {
      console.error('Error processing message content:', error);
      displayContent = content;
    }
    
    return { displayContent, thinkingContent, hasThinkingTags };
  };
  
  // Use the message's processed content if available, otherwise process it
  const displayContent = message.displayContent || processMessageContent(message.content).displayContent;
  const thinkingContent = message.thinkingContent || processMessageContent(message.content).thinkingContent;
  const hasThinkingContent = Boolean(thinkingContent && thinkingContent.length > 0);
  const isUser = message.role === 'user';
  
  // Render the thinking animation
  const renderThinkingAnimation = () => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography component="div" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography component="span" sx={{ fontWeight: 'medium' }}>
            {thinkingWord}
          </Typography>
          <Typography component="span" sx={{ opacity: 0.7 }}>...</Typography>
        </Typography>
      </Box>
    );
  };
  
  // Handle copy to clipboard
  const handleCopy = () => {
    if (message && message.content) {
      navigator.clipboard.writeText(message.content);
    }
  };
  
  // If message is null or invalid, don't render anything
  if (!message || !message.role) {
    return null;
  }
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 3,
        px: 2,
        py: 1,
      }}
    >
      <StyledAvatar 
        ownerState={{ isUser }}
        sx={{ 
          mr: isUser ? 0 : 2, 
          ml: isUser ? 2 : 0,
        }}
      >
        {isUser ? <PersonIcon /> : <SmartToyIcon />}
      </StyledAvatar>
      
      <Box sx={{ maxWidth: '90%' }}>
        <Typography 
          variant="caption" 
          component="div"
          sx={{ 
            mb: 0.5, 
            color: 'text.secondary',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {isUser ? 'You' : 'Elf AI'}
        </Typography>
        
        <MessageBubble 
          ownerState={{ 
            isUser, 
            isThinking: message.isThinking || isThinking 
          }} 
          elevation={0}
        >
          {isUser ? (
            <Typography component="div" sx={{
              '& ul, & ol': {
                paddingLeft: '1.5rem',
                marginTop: '0.5rem',
                marginBottom: '0.5rem',
              },
              '& li': {
                marginBottom: '0.25rem',
              }
            }}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Typography>
          ) : message.isThinking || isThinking ? (
            renderThinkingAnimation()
          ) : (
            <Box>
              <Typography component="div" sx={{
                '& ul, & ol': {
                  paddingLeft: '1.5rem',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem',
                },
                '& li': {
                  marginBottom: '0.25rem',
                }
              }}>
                <ReactMarkdown>{displayContent}</ReactMarkdown>
              </Typography>
              
              {hasThinkingContent && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <ThinkingToggle
                      startIcon={showThinking ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      onClick={() => setShowThinking(!showThinking)}
                      size="small"
                    >
                      {showThinking ? 'Hide thinking process' : 'Show thinking process'}
                    </ThinkingToggle>
                  </Box>
                  
                  <Collapse in={showThinking}>
                    <ThinkingProcess>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'medium' }}>
                        Thinking process:
                      </Typography>
                      <Typography component="div" sx={{
                        '& ul, & ol': {
                          paddingLeft: '1.5rem',
                          marginTop: '0.5rem',
                          marginBottom: '0.5rem',
                        },
                        '& li': {
                          marginBottom: '0.25rem',
                        }
                      }}>
                        <ReactMarkdown>{thinkingContent}</ReactMarkdown>
                      </Typography>
                    </ThinkingProcess>
                  </Collapse>
                </>
              )}
            </Box>
          )}
        </MessageBubble>
        
        <ActionButtons className="action-buttons">
          <IconButton size="small" onClick={handleCopy} sx={{ color: 'text.secondary' }}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </ActionButtons>
      </Box>
    </Box>
  );
} 