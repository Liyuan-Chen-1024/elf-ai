import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Avatar, IconButton, Paper, Button, Collapse } from '@mui/material';
import { styled } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ReactMarkdown from 'react-markdown';
import { Message } from '../../types';
import { CircularProgress } from '@mui/material';

// Modern styled message bubble with subtle shadow and rounded corners
const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'ownerState'
})(({ theme, ownerState }: { theme: any; ownerState: any }) => ({
  padding: theme.spacing(2, 3),
  borderRadius: theme.spacing(2),
  maxWidth: '100%',
  marginBottom: theme.spacing(1),
  boxShadow: 'rgba(0, 0, 0, 0.05) 0px 1px 2px, rgba(0, 0, 0, 0.1) 0px 1px 3px',
  backgroundColor: ownerState.isUser 
    ? theme.palette.grey[100] 
    : ownerState.isThinking 
      ? 'rgba(144, 202, 249, 0.2)' // Light blue for thinking state
      : 'rgba(144, 202, 249, 0.2)', // Same light blue for consistency
  color: theme.palette.text.primary,
  transition: 'all 0.2s ease',
  '& code': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: '2px 4px',
    borderRadius: '4px',
  },
  '& pre': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: theme.spacing(1.5),
    borderRadius: '8px',
    overflow: 'auto',
  },
  '& ul, & ol': {
    paddingLeft: theme.spacing(3),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  '& li': {
    marginBottom: theme.spacing(0.5),
  },
  '& p': {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    '&:first-of-type': {
      marginTop: 0,
    },
    '&:last-of-type': {
      marginBottom: 0,
    },
    '& div': {
      // Ensure divs inside paragraphs are displayed as inline blocks to avoid nesting errors
      display: 'inline-block',
    }
  },
}));

// Custom styled avatar with subtle gradient and bright colors
const StyledAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'ownerState'
})(({ theme, ownerState }: { theme: any; ownerState: any }) => ({
  width: 40,
  height: 40,
  background: ownerState.isUser 
    ? 'linear-gradient(135deg, #0052D4, #4364F7)' // Blue gradient for user
    : 'linear-gradient(135deg, #FF5F6D, #FFC371)', // Orange gradient for agent
  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 1px 3px',
  border: `2px solid ${theme.palette.background.paper}`,
  color: '#fff',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

// Action buttons container with hover effect
const ActionButtons = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  marginTop: theme.spacing(0.5),
  '& button': {
    padding: theme.spacing(0.5),
  },
}));

const MessageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  maxWidth: '90%',
  '&:hover': {
    '& .action-buttons': {
      opacity: 1,
    },
  },
}));

// Styled button for the "Show thinking" toggle
const ThinkingToggle = styled(Button)(({ theme }) => ({
  fontSize: '0.75rem',
  color: theme.palette.text.secondary,
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  textTransform: 'none',
  padding: theme.spacing(0.5, 1.5),
  borderRadius: 16,
  border: '1px solid rgba(0, 0, 0, 0.1)',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
}));

// Thinking process container
const ThinkingProcess = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(0, 0, 0, 0.03)',
  fontSize: '0.9em',
  border: '1px solid rgba(0, 0, 0, 0.05)',
}));

const THINKING_WORDS = [
  'Analyzing',
  'Processing',
  'Evaluating',
  'Considering',
  'Thinking about'
];

interface MessageItemProps {
  message: Message;
  isThinking?: boolean;
  isLoading?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  isThinking = false,
  isLoading = false
}) => {
  const [thinkingWord, setThinkingWord] = useState(THINKING_WORDS[0]);
  const [showThinking, setShowThinking] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Simulate thinking with word rotation
  useEffect(() => {
    if (isThinking) {
      // Rotate thinking words
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
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
  };
  
  const toggleThinking = () => {
    setShowThinking(!showThinking);
  };
  
  const isUser = message.role === 'user';
  const displayName = isUser 
    ? (message.sender?.name || 'You') 
    : (message.sender?.name || 'Elf Agent');
  
  // Function to render the thinking part of the message
  const renderThinkingContent = () => {
    // Split content into sentences
    const sentences = message.content.replace(/<[^>]*>/g, '').split(/[.!?]+/).filter(s => s.trim());
    const shortSentences = sentences.filter(s => s.trim().split(/\s+/).length >= 5 && s.trim().split(/\s+/).length <= 10);
    const sentenceIndex = thinkingWord.length % Math.max(1, shortSentences.length);
    const displayText = shortSentences.length > 0 ? shortSentences[sentenceIndex].replace(/[^a-zA-Z\s]/g, '') : message.content.replace(/<[^>]*>/g, '').split(/\s+/).slice(0, 10).join(' ').replace(/[^a-zA-Z\s]/g, '');
    return (
      <Typography component="div" sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        <CircularProgress size={16} sx={{ flexShrink: 0 }} />
        <Typography component="div" sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          width: '100%'
        }}>
          <Typography component="span" sx={{ fontWeight: 'bold', flexShrink: 0 }}>
            {thinkingWord}
          </Typography>
          <Typography 
            component="span" 
            sx={{ 
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis'
            }}
          >
            {displayText}
          </Typography>
        </Typography>
      </Typography>
    );
  };

  // Extract thinking content from the message
  const extractThinkingContent = () => {
    let displayContent = message.content;
    let thinkingContent = '';

    // Extract content between <think> tags if present
    const thinkMatch = displayContent.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      thinkingContent = thinkMatch[1].trim();
      // Remove the <think> section from display content
      displayContent = displayContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    }

    return { displayContent, thinkingContent };
  };
  
  const { displayContent, thinkingContent } = extractThinkingContent();
  const hasThinkingContent = Boolean(thinkingContent && thinkingContent.length > 0);
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 3,
        px: 2,
        py: 1,
        borderRadius: 2,
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
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
      
      <MessageContainer>
        <Typography 
          variant="caption" 
          component="div"
          sx={{ 
            display: 'block', 
            mb: 0.5, 
            color: 'text.secondary',
            fontWeight: 'medium',
            textAlign: isUser ? 'right' : 'left',
            pl: isUser ? 0 : 1,
            pr: isUser ? 1 : 0,
          }}
        >
          {displayName}
        </Typography>
        
        <MessageBubble 
          ownerState={{ isUser, isThinking: message.isThinking || isThinking }} 
          elevation={0}
        >
          {isUser ? (
            // User message is simple
            <Typography variant="body1" component="div" sx={{ wordBreak: 'break-word' }}>
              {message.content}
            </Typography>
          ) : message.isThinking || isThinking ? (
            // Thinking state
            <Typography component="div" sx={{ whiteSpace: 'pre-wrap' }}>
              {renderThinkingContent()}
            </Typography>
          ) : (
            // Final message with potential thinking section
            <Typography component="div">
              <ReactMarkdown>{displayContent}</ReactMarkdown>
              
              {hasThinkingContent && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <ThinkingToggle
                      startIcon={showThinking ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      onClick={toggleThinking}
                      size="small"
                    >
                      {showThinking ? 'Hide thinking process' : 'Show thinking process'}
                    </ThinkingToggle>
                  </Box>
                  
                  <Collapse in={showThinking} timeout="auto">
                    <ThinkingProcess>
                      <Typography variant="caption" component="div" sx={{ 
                        display: 'block', 
                        mb: 1, 
                        fontWeight: 'medium',
                        color: 'text.secondary' 
                      }}>
                        Thinking process:
                      </Typography>
                      <Typography component="div">
                        <ReactMarkdown>{thinkingContent}</ReactMarkdown>
                      </Typography>
                    </ThinkingProcess>
                  </Collapse>
                </>
              )}
            </Typography>
          )}
        </MessageBubble>
        
        <ActionButtons className="action-buttons">
          <IconButton size="small" onClick={handleCopy} sx={{ color: 'text.secondary' }}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </ActionButtons>
      </MessageContainer>
    </Box>
  );
}; 