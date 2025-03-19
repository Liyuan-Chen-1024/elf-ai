import React from 'react';
import { Avatar, Box, Paper, IconButton, Typography, useTheme } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import type { Message, UUID } from '../../types';
import { MarkdownPreview } from '../shared/MarkdownPreview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    Menu,
    MenuItem,
    TextField
} from '@mui/material';
import type { MouseEvent, FormEvent, ChangeEvent, KeyboardEvent } from 'react';

// Define the props interface
interface MessageItemProps {
  message: Message;
  onToggleThinking?: (messageId: UUID) => void;
  onEdit?: (messageId: string | number, content: string) => void;
  onDelete?: (messageId: string | number) => void;
  isHighlighted?: boolean;
}

export const MessageItem = ({
  message,
  onToggleThinking,
  onEdit,
  onDelete,
  isHighlighted = false,
}: MessageItemProps) => {
  const theme = useTheme();
  const isAssistant = message.role === 'assistant';

  // Check if this is a thinking message (has <think> tags)
  const isThinking = typeof message.content === 'string' && message.content.includes('<think>');
  const hasThinking = !!(message as any).hasThinking;
  
  // Handle the toggle thinking click
  const handleToggleThinking = () => {
    if (onToggleThinking) {
      onToggleThinking(message.id);
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 2,
        borderRadius: 2,
        backgroundColor: isHighlighted ? theme.palette.action.selected : 'transparent',
        transition: 'background-color 0.2s ease',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {isAssistant ? 'Elf AI' : 'You'}
        </Typography>
      </Box>
      <MarkdownPreview 
        content={message.content || ''} 
        hasThinking={hasThinking}
        onToggleThinking={handleToggleThinking}
      />
    </Box>
  );
}; 