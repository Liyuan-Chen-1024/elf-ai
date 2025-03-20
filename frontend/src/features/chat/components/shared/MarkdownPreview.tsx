import React, { useState, useEffect } from 'react';
import { Box, Typography, Collapse, Button, CircularProgress } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTheme } from '@mui/material/styles';

interface MarkdownPreviewProps {
  content: string;
  highlightMatches?: (text: string) => any;
  children?: any;
  isStreaming?: boolean;
  onToggleThinking?: () => void;
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: string | string[];
}

export const MarkdownPreview = ({
  content,
  highlightMatches,
  children,
  isStreaming = false,
  onToggleThinking,
}: MarkdownPreviewProps) => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [showThinking, setShowThinking] = useState(false);
  const [thinkingView, setThinkingView] = useState("");
  const theme = useTheme();
  
  // Extract thinking content and display content
  let displayContent = content;
  let thinkingContent = '';
  
  // Extract content between <think> tags if present
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    thinkingContent = thinkMatch[1].trim();
    // Remove the <think> section from display content
    displayContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  }
  
  // Effect for updating the rolling thinking preview
  useEffect(() => {
    if (!thinkingContent) return;
    
    let words = thinkingContent.split(/\s+/);
    let currentIndex = 0;
    
    // Initial preview - show "Analyzing request"
    setThinkingView("Analyzing request");
    
    const interval = setInterval(() => {
      if (words.length <= 5) {
        // If there are 5 or fewer words, just show them all
        setThinkingView("Analyzing request: " + words.join(" "));
        clearInterval(interval);
      } else {
        // Show a rolling window of 5 words
        let endIndex = Math.min(currentIndex + 5, words.length);
        let windowWords = words.slice(currentIndex, endIndex);
        
        // If we've reached the end, wrap around
        if (currentIndex >= words.length - 5) {
          currentIndex = 0;
        } else {
          currentIndex += 1;
        }
        
        setThinkingView("Analyzing request: " + windowWords.join(" "));
      }
    }, 700); // Update every 700ms
    
    return () => clearInterval(interval);
  }, [thinkingContent]);
  
  const toggleThinking = () => {
    setShowThinking(!showThinking);
    if (onToggleThinking) {
      onToggleThinking();
    }
  };

  if (highlightMatches) {
    return highlightMatches(displayContent);
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        '& pre': {
          margin: 0,
          padding: 2,
          borderRadius: 1,
          overflow: 'auto',
        },
        '& code': {
          fontFamily: 'monospace',
          fontSize: '0.9em',
        },
        '& p': {
          margin: 0,
          marginBottom: 1,
          '&:last-child': {
            marginBottom: 0,
          },
        },
        opacity: isStreaming ? 0.7 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <ReactMarkdown
        components={{
          pre: ({ children, ...props }) => (
            <pre {...props} style={{ margin: 0, padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
              {children}
            </pre>
          ),
          code: ({ inline, className, children }: CodeBlockProps) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={materialDark}
                language={match[1]}
                PreTag="div"
                customStyle={{ margin: 0 }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <Typography
                component="code"
                className={className}
                sx={{ fontFamily: 'monospace' }}
              >
                {children}
              </Typography>
            );
          },
        }}
      >
        {displayContent}
      </ReactMarkdown>
      
      {thinkingContent && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <Button
              startIcon={showThinking ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              onClick={toggleThinking}
              size="small"
              color="inherit"
              sx={{ fontSize: '0.75rem', textTransform: 'none' }}
            >
              {showThinking ? 'Hide thinking process' : 'Show thinking process'}
            </Button>
          </Box>
          
          <Collapse in={showThinking} timeout="auto">
            <Box sx={{ 
              mt: 1, 
              p: 3, 
              borderRadius: 1, 
              bgcolor: 'rgba(0, 0, 0, 0.03)', 
              border: '1px solid rgba(0, 0, 0, 0.08)',
              '& pre': {
                margin: theme.spacing(1, 0),
                padding: theme.spacing(1.5),
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
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
              }
            }}>
              <Typography variant="caption" sx={{ 
                display: 'block', 
                mb: 1, 
                fontWeight: 'medium',
                color: 'text.secondary' 
              }}>
                Thinking process:
              </Typography>
              <ReactMarkdown>{thinkingContent}</ReactMarkdown>
            </Box>
          </Collapse>
        </>
      )}
      
      {/* Display rolling thinking preview if content has <think> tags and isn't expanded */}
      {thinkingContent && !showThinking && (
        <Box 
          sx={{ 
            mt: 1,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'rgba(144, 202, 249, 0.2)',
            border: '1px solid rgba(144, 202, 249, 0.3)',
            color: 'rgba(0, 0, 0, 0.7)',
            fontSize: '0.85rem',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            maxWidth: '100%',
            overflow: 'hidden'
          }}
        >
          <CircularProgress size={14} thickness={4} sx={{ color: 'rgba(30, 136, 229, 0.7)', flexShrink: 0 }} />
          <Typography 
            component="span" 
            sx={{ 
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              display: 'block',
              width: '100%'
            }}
          >
            {thinkingView}
          </Typography>
        </Box>
      )}
      
      {children}
    </Box>
  );
}; 