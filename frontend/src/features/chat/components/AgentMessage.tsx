import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import 'highlight.js/styles/atom-one-dark.css'; // Better syntax highlighting theme
import { Message } from '../../../types';
import { THEME } from '../styles/theme.tsx';
import { MarkdownComponents } from './MarkdownComponents';

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
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        mb: 2,
        '&:last-child': { mb: 0 },
      }}
    >
      {/* Agent Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          mb: 1,
          ml: 2,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '42px',
            height: '42px',
            marginRight: '12px',
          }}
        >
          <Avatar
            alt="Elf Agent Avatar"
            src={THEME.avatars.assistant}
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              position: 'relative',
              boxShadow:
                message.status_generating === 'Completed'
                  ? THEME.colors.accent.purple.shadow
                  : 'none',
              ...(isGenerating && {
                animation: `${THEME.animations.float} 3s ease-in-out infinite, ${THEME.animations.pulse} 2s infinite`,
              }),
            }}
          />
        </Box>
        <Box sx={{ flex: 1, ml: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
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
              color:
                message.status_generating === 'Completed'
                  ? THEME.colors.text.completed
                  : THEME.colors.text.secondary,
              fontStyle: message.status_generating === 'Completed' ? 'normal' : 'italic',
              fontSize: THEME.typography.fontSize.tiny,
              fontWeight:
                message.status_generating === 'Completed'
                  ? THEME.typography.fontWeight.medium
                  : 'normal',
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          width: '100%',
          pl: 6,
        }}
      >
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
                '&:last-of-type': { marginBottom: 0 },
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
                '&:hover': { textDecoration: 'underline' },
              },
              '& img': {
                maxWidth: '100%',
                borderRadius: '4px',
              },
              '& blockquote': {
                borderLeft: `4px solid ${THEME.colors.background.inputBorder}`,
                margin: '0.5em 0',
                padding: '0 0 0 1em',
                color: THEME.colors.text.secondary,
              },
              '& hr': {
                border: 0,
                height: '1px',
                backgroundColor: THEME.colors.background.inputBorder,
                margin: '1em 0',
              },
              ...(isGenerating && {
                '&::after': {
                  content: '"|"',
                  display: 'inline-block',
                  marginLeft: '2px',
                  animation: `${THEME.animations.blink} 1s step-end infinite`,
                  color: 'rgba(28, 28, 30, 0.6)',
                  fontWeight: 200,
                },
              }),
            }}
          >
            <ReactMarkdown
              rehypePlugins={[rehypeRaw, [rehypeHighlight, { ignoreMissing: true }]]}
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
