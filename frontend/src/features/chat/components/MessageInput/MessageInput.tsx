import { useRef, useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Type a message...',
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const theme = useTheme();

  const handleKeyDown = (e: { key: string; shiftKey: boolean; preventDefault: () => void }) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleChange = (e: { target: { value: string } }) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        p: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
      }}
    >
      <TextField
        fullWidth
        multiline
        inputRef={inputRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxRows={6}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />
      <IconButton
        edge="end"
        onClick={handleSendMessage}
        disabled={disabled || !message.trim()}
        color="primary"
      >
        <SendIcon />
      </IconButton>
    </Box>
  );
}; 