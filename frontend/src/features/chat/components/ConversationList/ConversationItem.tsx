import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    TextField,
    Typography
} from '@mui/material';
import { useState } from 'react';
import type { Conversation } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onRename?: (title: string) => void;
  onDelete?: () => void;
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.title);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: { currentTarget: any; stopPropagation: () => void }) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenRenameDialog = () => {
    setNewTitle(conversation.title);
    setIsRenameDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseRenameDialog = () => {
    setIsRenameDialogOpen(false);
  };

  const handleRename = () => {
    if (onRename && newTitle.trim()) {
      onRename(newTitle.trim());
      handleCloseRenameDialog();
    }
  };

  const handleAction = (action: (() => void) | undefined) => {
    if (action) {
      action();
    }
    handleMenuClose();
  };

  // Format date to show how long ago the conversation was updated
  const formatDate = (dateString: string) => {
    const now = new Date();
    const updated = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - updated.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return updated.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <>
      <ListItem 
        disablePadding 
        secondaryAction={
          <IconButton 
            edge="end" 
            aria-label="more" 
            aria-controls={open ? 'conversation-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleMenuOpen}
            sx={{ 
              opacity: 0.7, 
              '&:hover': { opacity: 1 } 
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        }
        sx={{ display: 'block' }}
      >
        <ListItemButton
          selected={isSelected}
          onClick={onClick}
          sx={{
            py: 1.5,
            borderRadius: 1,
            mx: 1,
            '&.Mui-selected': {
              backgroundColor: 'primary.lighter',
              '&:hover': {
                backgroundColor: 'primary.lighter',
              },
            },
          }}
        >
          <ListItemIcon 
            sx={{ 
              minWidth: 40, 
              color: isSelected ? 'primary.main' : 'text.secondary' 
            }}
          >
            <ChatIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography
                variant="body1"
                sx={{
                  fontWeight: isSelected ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: isSelected ? 'primary.main' : 'text.primary',
                }}
              >
                {conversation.title}
              </Typography>
            }
            secondary={
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {formatDate(conversation.updatedAt)}
              </Typography>
            }
          />
        </ListItemButton>
      </ListItem>
      
      <Menu
        id="conversation-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        MenuListProps={{
          'aria-labelledby': 'conversation-menu-button',
          dense: true,
        }}
      >
        {onRename && (
          <MenuItem onClick={handleOpenRenameDialog}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => handleAction(onDelete)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
      
      {/* Rename dialog */}
      <Dialog 
        open={isRenameDialogOpen} 
        onClose={handleCloseRenameDialog} 
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Rename Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Conversation Name"
            type="text"
            fullWidth
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRenameDialog} color="inherit">Cancel</Button>
          <Button onClick={handleRename} color="primary" disabled={!newTitle.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 