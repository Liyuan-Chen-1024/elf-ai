import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import {
    Avatar,
    IconButton,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    alpha,
    Box,
    Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState, MouseEvent } from 'react';
import { ElfIcon } from './ElfIcon';
import { Conversation } from './types';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  onRename?: (conversation: Conversation) => void;
  onArchive: () => void;
  onDelete?: (conversation: Conversation) => void;
  isArchivedView?: boolean;
}

export const ConversationItem = ({ 
  conversation, 
  isSelected, 
  onClick, 
  onRename,
  onArchive,
  onDelete,
  isArchivedView = false
}: ConversationItemProps) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event: { currentTarget: Element; stopPropagation: () => void }) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRename = () => {
    handleMenuClose();
    if (onRename) {
      onRename(conversation);
    }
  };

  const handleArchive = () => {
    handleMenuClose();
    onArchive();
  };

  const handleDelete = () => {
    handleMenuClose();
    if (onDelete) {
      onDelete(conversation);
    }
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 2,
        cursor: 'pointer',
        bgcolor: isSelected ? 'action.selected' : 'transparent',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
      onClick={onClick}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1" noWrap>
          {conversation.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {conversation.lastMessage?.content || 'No messages'}
        </Typography>
      </Box>

      <IconButton
        size="small"
        onClick={handleMenuOpen}
      >
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRename} disabled={!onRename}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem onClick={handleArchive}>
          <ListItemIcon>
            {isArchivedView ? <UnarchiveIcon fontSize="small" /> : <ArchiveIcon fontSize="small" />}
          </ListItemIcon>
          {isArchivedView ? 'Unarchive' : 'Archive'}
        </MenuItem>
        <MenuItem onClick={handleDelete} disabled={!onDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
} 