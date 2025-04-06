import React from 'react';
import { Box, Typography, Avatar, CircularProgress } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/atom-one-dark.css'; // Better syntax highlighting theme
import { Message } from '../../../types';
import { THEME } from '../styles/theme';
import { Components } from 'react-markdown';

interface AgentMessageProps {
  message: Message;
}

/**
 * Custom renderers for Markdown components
 */
const MarkdownComponents: Partial<Components> = {
  // Override code block rendering
  code(props) {
    const { children, className } = props;
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    
    // Special handling for single-line code blocks (often used for variable names)
    const isSimpleCodeBlock = typeof children === 'string' && 
      !children.includes('\n') && 
      children.trim().length < 30;

    return !props.inline ? (
      <pre className={isSimpleCodeBlock ? 'simple-code-block' : ''}>
        {/* Code language indicator */}
        {language && (
          <div className="code-language-indicator">
            {language.toUpperCase()}
          </div>
        )}
        <code className={className || ''}>
          {children}
        </code>
      </pre>
    ) : (
      <code>
        {children}
      </code>
    );
  },
  
  // Override table rendering for better control
  table(props) {
    return (
      <div style={{ 
        overflowX: 'auto', 
        maxWidth: '100%', 
        margin: '1.5em 0',
        padding: '1em',
        background: '#f5f5f5',
        borderRadius: '8px',
      }}>
        <table 
          {...props} 
          style={{ 
            width: '100%', 
            borderCollapse: 'separate',
            borderSpacing: '3px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            background: 'white',
            border: '2px solid #aaa',
            borderRadius: '6px',
            overflow: 'hidden',
          }} 
        />
      </div>
    );
  },
  
  // Custom cell rendering
  td(props) {
    return (
      <td 
        {...props} 
        style={{
          border: '2px solid #aaa',
          padding: '1em',
          textAlign: 'center',
          verticalAlign: 'middle',
          fontSize: '1.5em',
          fontWeight: 700,
          color: 'black',
          backgroundColor: 'white',
          minWidth: '60px',
          minHeight: '60px',
        }}
      />
    );
  },
  
  // Custom header cell rendering
  th(props) {
    return (
      <th 
        {...props} 
        style={{
          border: '2px solid #aaa',
          padding: '1em',
          textAlign: 'center',
          verticalAlign: 'middle',
          fontSize: '1.5em',
          fontWeight: 700,
          color: 'black',
          backgroundColor: '#f0f0f0',
          minWidth: '60px',
          minHeight: '60px',
        }}
      />
    );
  },
  
  // Custom row rendering
  tr(props) {
    return (
      <tr 
        {...props} 
        style={{
          backgroundColor: 'white',
        }}
      />
    );
  }
};

/**
 * AgentMessage component displays messages from the AI agent.
 * It includes the agent's avatar, status, and message content.
 */
const AgentMessage: React.FC<AgentMessageProps> = ({ message }) => {
  const isGenerating = Boolean(message.is_generating);
  
  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      mb: 2,
      '&:last-child': { mb: 0 },
    }}>
      {/* Agent Header */}
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
            alt="Elf Agent"
            src={THEME.avatars.assistant}
            sx={{ 
              width: 32,
              height: 32,
              backgroundColor: THEME.colors.accent.purple.light,
              border: `1.5px solid ${THEME.colors.accent.purple.border}`,
              ...(isGenerating && {
                animation: `${THEME.animations.pulse} 2s infinite, ${THEME.animations.float} 3s ease-in-out infinite`,
              }),
            }}
          />
          {isGenerating && (
            <CircularProgress 
              size={40} 
              thickness={1.5}
              sx={{ 
                position: 'absolute',
                color: THEME.colors.accent.purple.border,
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
                color: THEME.colors.text.primary,
                fontWeight: THEME.typography.fontWeight.semibold,
                fontSize: THEME.typography.fontSize.small,
                letterSpacing: THEME.typography.spacing.tight,
              }}
            >
              Elf Agent
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: THEME.colors.text.muted,
                fontSize: THEME.typography.fontSize.tiny,
              }}
            >
              {new Date().toLocaleTimeString()}
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: THEME.colors.text.secondary,
              fontStyle: 'italic',
              fontSize: THEME.typography.fontSize.tiny,
              ...(isGenerating && {
                animation: `${THEME.animations.float} 3s ease-in-out infinite`,
              }),
            }}
          >
            {message.status_generating}
          </Typography>
        </Box>
      </Box>

      {/* Agent Message Content */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'flex-start',
        width: '100%',
        pl: 6,
      }}>
        <Box 
          sx={{
            wordBreak: 'break-word',
            p: { xs: 2, sm: 2.5 },
            background: THEME.colors.background.assistant,
            color: THEME.colors.text.primary,
            width: '100%',
            maxWidth: '85%',
            position: 'relative',
            borderRadius: '0.5rem',
          }}
        > 
          <Box 
            data-message-id={message.id || ''}
            sx={{ 
              position: 'relative',
              fontFamily: 'inherit',
              fontSize: THEME.typography.fontSize.regular,
              lineHeight: 1.6,
              letterSpacing: THEME.typography.spacing.tight,
              minHeight: '20px',
              // Markdown component styling
              '& p': { 
                margin: '0.5em 0',
                '&:first-of-type': { marginTop: 0 },
                '&:last-of-type': { marginBottom: 0 } 
              },
              '& h1, & h2, & h3, & h4, & h5, & h6': { 
                margin: '0.75em 0 0.5em 0',
                fontWeight: THEME.typography.fontWeight.semibold,
                '&:first-of-type': { marginTop: 0 },
              },
              '& h1': { fontSize: '1.6em' },
              '& h2': { fontSize: '1.4em' },
              '& h3': { fontSize: '1.2em' },
              '& h4': { fontSize: '1.1em' },
              '& h5, & h6': { fontSize: '1em' },
              '& ul, & ol': { paddingLeft: '1.5em', margin: '0.5em 0' },
              '& li': { margin: '0.25em 0' },
              '& a': { 
                color: THEME.colors.primary.main,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              },
              '& img': {
                maxWidth: '100%',
                borderRadius: '4px'
              },
              '& blockquote': {
                borderLeft: `4px solid ${THEME.colors.background.inputBorder}`,
                margin: '0.5em 0',
                padding: '0 0 0 1em',
                color: THEME.colors.text.secondary
              },
              '& hr': {
                border: 0,
                height: '1px',
                backgroundColor: THEME.colors.background.inputBorder,
                margin: '1em 0'
              },
              ...(isGenerating && {
                '&::after': {
                  content: '"|"',
                  display: 'inline-block',
                  marginLeft: '2px',
                  animation: `${THEME.animations.blink} 1s step-end infinite`,
                  color: 'rgba(28, 28, 30, 0.6)',
                  fontWeight: 200,
                }
              })
            }}
          >
            <ReactMarkdown
              rehypePlugins={[
                rehypeRaw,
                [rehypeHighlight, { ignoreMissing: true }]
              ]}
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {message.content || ''}
            </ReactMarkdown>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AgentMessage; 