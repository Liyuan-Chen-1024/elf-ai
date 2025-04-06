import React, { useState, KeyboardEvent } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  CircularProgress 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { THEME } from '../styles/theme';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  conversationId?: string;
}

/**
 * MessageInput component for entering and sending chat messages.
 * It includes:
 * - Text field for entering messages
 * - Send button
 * - Loading indicator
 * - Enter key handling
 */
const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = 'Type a message...',
  conversationId,
}) => {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        position: 'relative',
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '30px',
            backgroundColor: '#fff',
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: THEME.colors.primary.main,
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: '14px 60px 14px 20px',
          },
        }}
      />
      <IconButton
        onClick={handleSendMessage}
        disabled={isLoading || !message.trim()}
        sx={{
          position: 'absolute',
          right: '8px',
          color: isLoading || !message.trim() 
            ? 'rgba(0, 0, 0, 0.3)' 
            : THEME.colors.primary.main,
          '&:hover': {
            backgroundColor: 'rgba(124, 77, 255, 0.08)',
          },
        }}
      >
        {isLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <SendIcon />
        )}
      </IconButton>
    </Box>
  );
};

export default MessageInput; 