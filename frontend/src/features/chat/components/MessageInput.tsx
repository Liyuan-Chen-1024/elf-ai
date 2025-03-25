import React, { useState, KeyboardEvent } from 'react';
import { Box, TextField, IconButton, Paper, alpha } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

function MessageInput({ 
  onSendMessage, 
  isDisabled = false, 
  placeholder = 'Type a message...'
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isDisabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 1, sm: 1.5 },
        borderRadius: 2.5,
        backdropFilter: 'blur(10px)',
        backgroundColor: theme => alpha(theme.palette.background.paper, 0.9),
        transition: 'all 0.2s ease',
        transform: 'translateY(0)',
        '&:hover': {
          boxShadow: theme => `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={isDisabled}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              p: { xs: '6px', sm: '8px' },
              borderRadius: 2,
              fontSize: '0.95rem',
              backgroundColor: theme => alpha(theme.palette.background.default, 0.5),
              '&:hover': {
                backgroundColor: theme => alpha(theme.palette.background.default, 0.7),
              },
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={isDisabled || !message.trim()}
          sx={{ 
            width: { xs: 40, sm: 44 }, 
            height: { xs: 40, sm: 44 },
            flexShrink: 0,
            backgroundColor: 'primary.main',
            color: 'white',
            boxShadow: theme => `0 2px 6px ${alpha(theme.palette.primary.main, 0.4)}`,
            transition: 'all 0.2s',
            '&:hover': {
              backgroundColor: 'primary.dark',
              transform: 'scale(1.05)',
            },
            '&:disabled': {
              backgroundColor: 'action.disabledBackground',
              color: 'action.disabled',
              boxShadow: 'none',
            }
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );
}

export default MessageInput; 