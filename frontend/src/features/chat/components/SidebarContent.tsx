import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Typography,
  Paper,
  Button,
  alpha,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Conversation } from '../../../types';
import { THEME } from '../styles/theme';

interface SidebarContentProps {
  conversations: Conversation[];
  activeConversationId?: string | undefined;
  isCreating: boolean;
  isDeleting: boolean;
  onNewChat: () => void;
  onConversationClick: (conversation: Conversation) => void;
  onDeleteClick: (id: string, e: React.MouseEvent) => void;
}

/**
 * SidebarContent is a presentational component that renders the sidebar UI.
 * It contains no business logic, only display elements and event handlers passed as props.
 */
const SidebarContent: React.FC<SidebarContentProps> = ({
  conversations,
  activeConversationId,
  isCreating,
  isDeleting,
  onNewChat,
  onConversationClick,
  onDeleteClick,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        py: 1.5,
        px: 2,
        overflow: 'hidden',
      }}
    >
      {/* New Chat Button */}
      <Button
        variant="contained"
        startIcon={<AddIcon fontSize="small" />}
        onClick={onNewChat}
        disabled={isCreating}
        fullWidth
        sx={{
          mb: 1.5,
          borderRadius: 1.5,
          padding: '4px 12px',
          height: '32px',
          textTransform: 'none',
          fontWeight: THEME.typography.fontWeight.semibold,
          fontSize: '0.8rem',
          background: THEME.colors.primary.gradient,
          boxShadow: '0 2px 8px rgba(124, 77, 255, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(124, 77, 255, 0.3)',
            background: THEME.colors.primary.hoverGradient,
            opacity: 0.9,
          },
        }}
      >
        New Chat
      </Button>

      {/* Separator */}
      <Box
        sx={{
          height: '1px',
          width: '100%',
          mb: 1.5,
          background: THEME.colors.background.headerBorder,
        }}
      />

      {/* Conversations Header */}
      <Typography
        variant="subtitle2"
        sx={{
          px: 1.5,
          mb: 1,
          fontWeight: THEME.typography.fontWeight.semibold,
          fontSize: THEME.typography.fontSize.tiny,
          color: THEME.colors.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Recent Conversations
      </Typography>

      {/* Conversations List */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List disablePadding dense>
          {conversations.length === 0 ? (
            <ListItem sx={{ py: 1.5, px: 1 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  width: '100%',
                  backgroundColor: theme => alpha(theme.palette.background.paper, 0.5),
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                }}
              >
                <ListItemText
                  primary="No conversations yet"
                  secondary="Start a new chat to begin"
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: THEME.typography.fontWeight.semibold,
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    fontSize: THEME.typography.fontSize.tiny,
                  }}
                />
              </Paper>
            </ListItem>
          ) : (
            conversations.map((conversation: Conversation) => (
              <ListItem key={conversation.id} disablePadding sx={{ mb: 0.75 }}>
                <ListItemButton
                  dense
                  selected={activeConversationId === conversation.id}
                  onClick={() => onConversationClick(conversation)}
                  sx={{
                    borderRadius: 1.5,
                    py: 1,
                    pl: 1.5,
                    '&.Mui-selected': {
                      backgroundColor: theme => alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        backgroundColor: theme => alpha(theme.palette.primary.main, 0.15),
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ChatIcon
                      color={conversation.archived ? 'disabled' : 'primary'}
                      fontSize="small"
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={conversation.title}
                    secondary={
                      conversation.lastMessage?.content
                        ? conversation.lastMessage.content.substring(0, 25) +
                          (conversation.lastMessage.content.length > 25 ? '...' : '')
                        : 'New conversation'
                    }
                    primaryTypographyProps={{
                      noWrap: true,
                      fontWeight: THEME.typography.fontWeight.semibold,
                      fontSize: '0.9rem',
                      color: conversation.archived ? 'text.disabled' : 'text.primary',
                    }}
                    secondaryTypographyProps={{
                      noWrap: true,
                      variant: 'caption',
                      fontSize: THEME.typography.fontSize.tiny,
                      color: 'text.secondary',
                    }}
                    sx={{ my: 0 }}
                  />
                  <Tooltip title="Delete conversation">
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      size="small"
                      onClick={e => onDeleteClick(conversation.id, e)}
                      disabled={isDeleting}
                      sx={{
                        opacity: 0.7,
                        padding: '2px',
                        '&:hover': {
                          opacity: 1,
                          color: THEME.colors.accent.red.main,
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Box>
    </Box>
  );
};

export default SidebarContent;
