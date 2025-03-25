import React, { useState, KeyboardEvent } from 'react';
import { Box, TextField, IconButton, Paper } from '@mui/material';
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
      elevation={2}
      sx={{
        p: 2,
        borderRadius: 2,
        position: 'sticky',
        bottom: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
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
          variant="outlined"
          InputProps={{
            sx: {
              borderRadius: 5,
              '& fieldset': {
                borderWidth: '1px',
              },
            },
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={isDisabled || !message.trim()}
          sx={{ ml: 1 }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}

export default MessageInput; 