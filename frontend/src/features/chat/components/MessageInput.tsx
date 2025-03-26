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

  // Track previous loading state to detect transitions
  const prevLoadingRef = useRef(isLoading);
  
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

  // Focus management - ensure focus returns when streaming completes
  useEffect(() => {
    // If loading just finished (was loading but now it's not)
    if (prevLoadingRef.current === true && isLoading === false) {
      // Small delay to ensure UI has updated
      window.setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    }
    
    // Update the ref for next render
    prevLoadingRef.current = isLoading;
  }, [isLoading]);
  
  // Initial focus when conversation changes
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversationId, isLoading]);

  
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: 1.5,
      position: 'relative',
    }}>
      <TextField
        multiline
        maxRows={2}
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
            backgroundColor: 'white',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid',
            borderColor: isFocused ? 'rgba(124, 77, 255, 0.5)' : 'rgba(0, 0, 0, 0.1)',
            boxShadow: isFocused 
              ? '0 0 0 2px rgba(124, 77, 255, 0.2), 0 2px 10px rgba(0, 0, 0, 0.06)'
              : '0 2px 6px rgba(0, 0, 0, 0.05)',
            transition: 'all 0.2s ease',
            '& textarea': {
              padding: '8px 12px',
              paddingRight: '40px', // Make room for the send button
              fontSize: '0.9375rem',
              lineHeight: 1.2,
              color: '#1C1C1E',
              minHeight: '20px !important',
              height: '20px !important',
              maxHeight: '60px !important',
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
          position: 'absolute',
          right: '8px',
          bottom: '6px',
          width: '24px',
          height: '24px',
          minWidth: '24px',
          minHeight: '24px',
          backgroundColor: message.trim() ? '#7C4DFF' : 'rgba(124, 77, 255, 0.1)',
          color: message.trim() ? '#FFFFFF' : '#7C4DFF',
          padding: '4px',
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
          fontSize: '0.9rem',
          transform: 'translateX(1px)',
        }} />
      </IconButton>
    </Box>
  );
}

export default MessageInput; 