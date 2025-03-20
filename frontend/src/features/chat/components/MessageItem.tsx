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
  const [processedContent, setProcessedContent] = useState({ displayContent: '', thinkingContent: '' });
  const intervalRef = useRef(null);
  
  // Process the message content on mount and when message changes
  useEffect(() => {
    if (message && message.content) {
      console.log(`Processing message: ${message.id.toString().substring(0, 8)}...`);
      const { displayContent, thinkingContent } = processMessageContent(message.content);
      setProcessedContent({ displayContent, thinkingContent });

      // If we didn't find thinking content, log a more detailed message
      if (!thinkingContent) {
        console.log(`No thinking content in message: ${message.id} - Content preview: ${message.content.substring(0, 30)}...`);
      }
    }
  }, [message]);
  
  // Rotate thinking words for animation
  useEffect(() => {
    if (message?.isThinking || isThinking) {
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
  }, [message?.isThinking, isThinking]);
  
  // Extract content from message
  const processMessageContent = (content) => {
    // Default values
    let displayContent = content || '';
    let thinkingContent = '';
    
    try {
      // First, clean up any raw <think> tags at the beginning of the message
      if (displayContent.startsWith('<think>')) {
        console.log('MessageItem: Cleaning up raw think tag at beginning');
        const thinkingSection = displayContent.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkingSection) {
          thinkingContent = thinkingSection[1].trim();
          displayContent = displayContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
        }
      }
      
      // Look for <think> tags - handle both encoded and plain versions
      // First check for encoded version (visible in UI)
      if (displayContent.includes('&lt;think&gt;')) {
        // Handle HTML encoded think tags
        const thinkMatch = displayContent.match(/&lt;think&gt;([\s\S]*?)&lt;\/think&gt;/);
        if (thinkMatch) {
          thinkingContent = thinkMatch[1].trim();
          // Remove think tags from display content
          displayContent = displayContent.replace(/&lt;think&gt;[\s\S]*?&lt;\/think&gt;/, '').trim();
          console.log('MessageItem: Found encoded thinking content');
        }
      }
      // Then check for normal version
      else if (displayContent.includes('<think>')) {
        const thinkMatch = displayContent.match(/<think>([\s\S]*?)<\/think>/);
        if (thinkMatch) {
          thinkingContent = thinkMatch[1].trim();
          // Remove think tags from display content
          displayContent = displayContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
          
          console.log('MessageItem: Found thinking content:', 
                    thinkingContent.length > 50 ? 
                    thinkingContent.substring(0, 50) + '...' : 
                    thinkingContent);
        }
      }
      
      // Validate thinking content - don't use it if it's just empty or a placeholder
      if (thinkingContent) {
        // Check if thinking content is just empty or contains only the tag itself
        if (thinkingContent.trim() === "" || 
            thinkingContent.trim() === "<think>" ||
            thinkingContent.match(/^\s*<think>\s*<\/think>\s*$/)) {
          console.log('MessageItem: Discarding empty thinking content');
          thinkingContent = "";
        }
      }

      // If no thinking tags but it's an assistant message, create a fallback thinking content
      if (!thinkingContent && message && message.role === 'assistant' && !message.isThinking) {
        // Use the first paragraph as thinking content
        const paragraphs = displayContent.split('\n\n');
        if (paragraphs.length > 0 && paragraphs[0].length > 10) { // Only use if it's meaningful
          thinkingContent = paragraphs[0];
          console.log('MessageItem: Created fallback thinking content');
        }
      }
    } catch (error) {
      console.error('Error processing message content:', error);
    }
    
    // Extra thorough cleanup to ensure no think tags remain visible
    displayContent = displayContent
      .replace(/<think>/g, '')
      .replace(/<\/think>/g, '')
      .replace(/&lt;think&gt;/g, '')
      .replace(/&lt;\/think&gt;/g, '')
      .replace(/^<think>[\s\S]*?<\/think>\s*/g, '') // Remove any think tags at the beginning
      .replace(/^\s*<think>\s*/, '') // Handle orphaned opening tag
      .replace(/\s*<\/think>\s*/, '') // Handle orphaned closing tag
      .trim();
    
    return { displayContent, thinkingContent };
  };
  
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
  
  const { displayContent, thinkingContent } = processedContent;
  // Check if thinking content is meaningful (not just <think> tags or empty)
  const hasThinkingContent = thinkingContent && 
                             thinkingContent.length > 0 && 
                             !thinkingContent.match(/^\s*<think>\s*<\/think>\s*$/) &&
                             thinkingContent !== "<think>";
  const isUser = message && message.role === 'user';
  
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
              '& hr': {
                margin: '1.5rem 0',
                border: 'none',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
              },
              '& ul': {
                paddingLeft: '2rem',
                marginTop: '0.5rem',
                marginBottom: '0.5rem',
              },
              '& ol': {
                paddingLeft: '2rem',
                marginTop: '0.5rem',
                marginBottom: '0.5rem',
              },
              '& li': {
                marginBottom: '0.25rem',
              },
            }}>
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </Typography>
          ) : message.isThinking || isThinking ? (
            renderThinkingAnimation()
          ) : (
            <Box>
              <Typography component="div" sx={{ 
                '& hr': {
                  margin: '1.5rem 0',
                  border: 'none',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                },
                '& ul': {
                  paddingLeft: '2rem',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem',
                },
                '& ol': {
                  paddingLeft: '2rem',
                  marginTop: '0.5rem',
                  marginBottom: '0.5rem',
                },
                '& li': {
                  marginBottom: '0.25rem',
                },
              }}>
                <ReactMarkdown>{displayContent}</ReactMarkdown>
              </Typography>
              
              {hasThinkingContent && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <ThinkingToggle
                      startIcon={showThinking ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      onClick={() => setShowThinking(!showThinking)}
                      size="small"
                      variant="outlined"
                    >
                      {showThinking ? 'Hide thinking process' : 'Show thinking process'}
                    </ThinkingToggle>
                  </Box>
                  
                  <Collapse in={showThinking} timeout="auto">
                    <ThinkingProcess>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'medium' }}>
                        Thinking process:
                      </Typography>
                      <Typography component="div" sx={{ 
                        '& hr': {
                          margin: '1.5rem 0',
                          border: 'none',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                        },
                        '& ul': {
                          paddingLeft: '2rem',
                          marginTop: '0.5rem',
                          marginBottom: '0.5rem',
                        },
                        '& ol': {
                          paddingLeft: '2rem',
                          marginTop: '0.5rem',
                          marginBottom: '0.5rem',
                        },
                        '& li': {
                          marginBottom: '0.25rem',
                        },
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