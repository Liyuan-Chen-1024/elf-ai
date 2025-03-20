import React, { useState } from 'react';
import { Avatar, Box, Paper, IconButton, Typography, useTheme } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import type { Message, UUID } from '../../types';
import { MarkdownPreview } from '../shared/MarkdownPreview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import {
    Menu,
    MenuItem,
    TextField
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { styled } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';

const MessageBubble = styled(Paper)(({ theme, role }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  maxWidth: '80%',
  marginBottom: theme.spacing(1),
  backgroundColor: role === 'assistant' ? theme.palette.primary.light : theme.palette.grey[100],
  color: role === 'assistant' ? theme.palette.primary.contrastText : theme.palette.text.primary,
}));

// Define the props interface
interface MessageItemProps {
  message: Message;
  onEdit: (messageId: UUID, content: string) => void;
  isHighlighted: boolean;
  onHighlight: (messageId: UUID | null) => void;
  isLoading: boolean;
  isStreaming: boolean;
}

export const MessageItem = ({
  message,
  onEdit,
  isHighlighted = false,
  onHighlight,
  isLoading,
  isStreaming,
}: MessageItemProps) => {
  const theme = useTheme();
  const isAssistant = message.role === 'assistant';
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const handleMenuClick = (event: { currentTarget: Element }) => {
    setAnchorEl(event.currentTarget);
    onHighlight(message.id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    onHighlight(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    handleMenuClose();
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleEditSave = () => {
    onEdit(message.id, editedContent);
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    handleMenuClose();
  };

  // Determine the avatar URL
  const avatarUrl = message.sender?.avatar || 
    (message.role === 'user' 
      ? 'https://i.pravatar.cc/150?img=1' 
      : 'https://i.pravatar.cc/150?img=2');
  
  const isUser = message.role === 'user';
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: isUser ? 'row-reverse' : 'row',
        mb: 2,
        p: 1,
        backgroundColor: isHighlighted ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
      }}
    >
      <Avatar 
        src={avatarUrl} 
        sx={{ 
          mr: isUser ? 0 : 2, 
          ml: isUser ? 2 : 0,
          bgcolor: isUser ? 'secondary.main' : 'primary.main',
        }}
      >
        {message.sender?.name?.[0] || (isUser ? 'U' : 'A')}
      </Avatar>
      
      <Box sx={{ maxWidth: '80%' }}>
        <MessageBubble role={message.role} elevation={1}>
          {isEditing ? (
            <Box>
              <TextField
                fullWidth
                multiline
                variant="outlined"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton size="small" onClick={handleEditCancel}>
                  <CloseIcon />
                </IconButton>
                <IconButton size="small" onClick={handleEditSave} color="primary">
                  <DoneIcon />
                </IconButton>
              </Box>
            </Box>
          ) : (
            <Box>
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {message.isEdited && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                  (edited)
                </Typography>
              )}
            </Box>
          )}
        </MessageBubble>
        
        {!isEditing && !isUser && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
            {onEdit && (
              <IconButton size="small" onClick={handleEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={handleCopy}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
}; 