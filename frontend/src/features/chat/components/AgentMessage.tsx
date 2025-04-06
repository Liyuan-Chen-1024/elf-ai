import React from 'react';
import { Box, Typography, Avatar, CircularProgress } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/github.css'; // Import a highlight.js style
import { Message } from '../../../types';
import { THEME } from '../styles/theme';

interface AgentMessageProps {
  message: Message;
}

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
              '& code': { 
                backgroundColor: 'rgba(0,0,0,0.05)', 
                padding: '2px 4px', 
                borderRadius: '3px',
                fontFamily: 'monospace',
                fontSize: '0.9em'
              },
              '& pre': { 
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '0.75em',
                borderRadius: '4px',
                overflowX: 'auto',
                margin: '0.5em 0',
                '& code': { 
                  backgroundColor: 'transparent',
                  padding: 0,
                  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                }
              },
              // Highlight.js styling tweaks
              '& .hljs': {
                background: 'transparent',
                padding: 0
              },
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
              // Table styling
              '& table': {
                borderCollapse: 'separate',
                borderSpacing: '0',
                width: '100%',
                margin: '1em 0',
                border: `2px solid #c0c0c0`,
                borderRadius: '8px',
                boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
                overflow: 'hidden',
                background: 'white',
                '& th, & td': {
                  border: `2px solid #c0c0c0`,
                  padding: '1em',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                  minWidth: '4em',
                  height: '3em',
                  fontSize: '1.5em',
                  fontWeight: 600,
                  color: '#000000',
                  backgroundColor: '#ffffff',
                },
                '& th': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: THEME.typography.fontWeight.semibold,
                  color: '#444',
                },
                // Make tables display as grid for better appearance
                '& tr': {
                  display: 'table-row',
                  '&:nth-of-type(even)': {
                    backgroundColor: '#ffffff'
                  },
                  '&:hover': {
                    backgroundColor: '#f8f8ff'
                  }
                }
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