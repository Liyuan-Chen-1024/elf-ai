import React, { useEffect, useState } from 'react';
import { Box, Typography, Avatar, CircularProgress } from '@mui/material';
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
            {isGenerating ? `Generating` : 'Completed'}
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
          }}
        > 
          <Typography 
            component="div" 
            data-message-id={message.id || ''}
            sx={{ 
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              fontSize: THEME.typography.fontSize.regular,
              lineHeight: 1.6,
              letterSpacing: THEME.typography.spacing.tight,
              minHeight: '20px',
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
            {message.content || ''}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AgentMessage; 