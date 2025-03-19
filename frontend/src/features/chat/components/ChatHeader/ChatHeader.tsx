import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MenuIcon from '@mui/icons-material/Menu';
import {
    alpha,
    AppBar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    TextField,
    Toolbar,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useState } from 'react';
import type { Conversation } from '../../types';

interface ChatHeaderProps {
  conversation: Conversation | null;
  onToggleDrawer: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  isMobile?: boolean;
}

export function ChatHeader({
  conversation,
  onToggleDrawer,
  onRename,
  onDelete,
  isMobile = false,
}: ChatHeaderProps) {
  const theme = useTheme();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const isMd = useMediaQuery(theme.breakpoints.up('md'));
  
  const handleOpenRenameDialog = () => {
    setNewTitle(conversation?.title || '');
    setRenameDialogOpen(true);
  };
  
  const handleCloseRenameDialog = () => {
    setRenameDialogOpen(false);
  };
  
  const handleRename = () => {
    if (newTitle.trim() !== '' && conversation) {
      onRename(newTitle.trim());
      handleCloseRenameDialog();
    }
  };
  
  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };
  
  const handleDelete = () => {
    onDelete();
    handleCloseDeleteDialog();
  };
  
  if (!conversation) return null;
  
  return (
    <AppBar 
      position="relative" 
      color="inherit"
      elevation={0}
      sx={{ 
        zIndex: 'auto',
        height: '56px',
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}
    >
      <Toolbar
        sx={{
          minHeight: '56px !important',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isMobile && (
            <IconButton 
              edge="start" 
              onClick={onToggleDrawer}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="subtitle1"
            noWrap
            sx={{
              fontWeight: 'bold',
              color: theme.palette.text.primary,
              maxWidth: { xs: '150px', sm: '250px', md: '100%' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {conversation.title}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Rename conversation">
            <IconButton
              onClick={handleOpenRenameDialog}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Delete conversation">
            <IconButton
              onClick={handleOpenDeleteDialog}
              size="small"
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.error.main,
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      {/* Rename dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={handleCloseRenameDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 'bold',
            pb: 1,
          }}
        >
          Rename Conversation
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            label="Conversation Name"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            variant="outlined"
            sx={{
              minWidth: 300,
              '.MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseRenameDialog} 
            variant="text"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.secondary, 0.08),
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRename} 
            variant="contained"
            disabled={newTitle.trim() === ''}
            sx={{
              px: 3,
              borderRadius: 28,
              backgroundColor: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark,
              },
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.error.main,
            pb: 1,
          }}
        >
          Delete Conversation
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body1">
            Are you sure you want to delete this conversation? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            variant="text"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.text.secondary, 0.08),
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained"
            color="error"
            sx={{
              px: 3,
              borderRadius: 28,
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
} 