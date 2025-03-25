import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  conversationId?: string | undefined;
}

function MessageInput({ 
  onSendMessage, 
  isLoading = false,
  placeholder = "Message Elf Agent...",
  conversationId
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 80)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading, conversationId]);

  
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 1.5,
      mb: 1,
    }}>
      <TextField
        multiline
        maxRows={3}
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        inputRef={inputRef}
        disabled={isLoading}
        fullWidth
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'rgba(247, 249, 252, 0.8)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: isFocused ? 'rgba(124, 77, 255, 0.3)' : 'rgba(0, 0, 0, 0.08)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            '& textarea': {
              padding: '8px 12px',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              color: '#1C1C1E',
              minHeight: '20px',
              '&::placeholder': {
                color: '#6C6C70',
                opacity: 0.8,
              },
            },
            '& fieldset': {
              border: 'none',
            },
          },
        }}
      />
      
      <IconButton
        onClick={handleSend}
        disabled={!message.trim() || isLoading}
        sx={{
          width: 40,
          height: 40,
          backgroundColor: message.trim() ? '#7C4DFF' : 'rgba(124, 77, 255, 0.1)',
          color: message.trim() ? '#FFFFFF' : '#7C4DFF',
          mb: 0.25,
          '&:hover': {
            backgroundColor: message.trim() ? '#9E7EFF' : 'rgba(124, 77, 255, 0.15)',
          },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
            color: 'rgba(0, 0, 0, 0.26)',
          },
        }}
      >
        <SendIcon sx={{ 
          fontSize: '1.25rem',
          transform: 'translateX(1px)',
        }} />
      </IconButton>
    </Box>
  );
}

export default MessageInput; 