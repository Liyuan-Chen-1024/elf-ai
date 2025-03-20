import { useRef, KeyboardEvent, useState, useEffect } from 'react';
import { Box, TextField, IconButton, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';

// Styled input container with subtle hover effect
const InputContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius * 3,
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
  '&:hover, &:focus-within': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    borderColor: theme.palette.primary.main,
  },
}));

// Styled send button with pulse animation when active
const SendButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  transition: 'all 0.2s ease',
  '&.active': {
    animation: 'pulse 1.5s infinite',
  },
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(0, 123, 255, 0.4)',
    },
    '70%': {
      boxShadow: '0 0 0 10px rgba(0, 123, 255, 0)',
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(0, 123, 255, 0)',
    },
  },
}));

export interface MessageInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend: () => void;
  isDisabled?: boolean;
  placeholder?: string;
  showSidebarToggle?: boolean;
  onToggleSidebar?: () => void;
  onSendMessage?: (message: string) => void; // Legacy prop
  disabled?: boolean; // Legacy prop
}

export const MessageInput = ({
  value = '',
  onChange,
  onSend,
  isDisabled = false,
  disabled = false, // Legacy prop
  placeholder = 'Type a message',
  showSidebarToggle = false,
  onToggleSidebar,
  onSendMessage, // Legacy prop
}: MessageInputProps) => {
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use either the new or legacy disabled prop
  const isInputDisabled = isDisabled || disabled;
  
  // Update internal state when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleSend = () => {
    if (inputValue.trim() && !isInputDisabled) {
      // Support both new and legacy send handlers
      if (onSendMessage) {
        onSendMessage(inputValue);
      } else {
        onSend();
      }
      
      // Only clear if not controlled by parent
      if (!onChange) {
        setInputValue('');
      }
      
      // Focus input after sending
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <InputContainer elevation={0}>
      {showSidebarToggle && (
        <IconButton 
          onClick={onToggleSidebar}
          sx={{ mr: 1 }}
          size="small"
          color="primary"
        >
          <MenuIcon />
        </IconButton>
      )}
      
      <TextField
        fullWidth
        multiline
        maxRows={4}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={isInputDisabled}
        inputRef={inputRef}
        variant="standard"
        sx={{
          '& .MuiInputBase-root': {
            p: 0.5,
            border: 'none',
            fontSize: '1rem',
          },
          '& .MuiInput-underline:before, & .MuiInput-underline:after': {
            display: 'none',
          },
        }}
        InputProps={{
          disableUnderline: true,
        }}
      />
      
      <Box sx={{ ml: 1 }}>
        <SendButton
          disabled={!inputValue.trim() || isInputDisabled}
          onClick={handleSend}
          className={inputValue.trim() && !isInputDisabled ? 'active' : ''}
          size="small"
        >
          <SendIcon fontSize="small" />
        </SendButton>
      </Box>
    </InputContainer>
  );
}; 