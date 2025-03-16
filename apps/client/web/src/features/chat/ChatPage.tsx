import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Collapse,
    Drawer,
    Fade,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    TextField,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
    Zoom
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { chatApi } from './api';
import { Conversation, Message } from './types';
// Import icons
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import MenuIcon from '@mui/icons-material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import { alpha } from '@mui/material/styles';
import { ElfIcon, ElfLogoIcon } from './ElfIcon';
import MarkdownPreview from './MarkdownPreview';

// Add a TypedMessage interface that extends Message with a status
interface TypedMessage extends Message {
  status?: 'thinking' | 'generating' | 'complete' | 'error' | 'streaming';
  isTemporary?: boolean; // Add flag to identify temporary messages
}

export const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<TypedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewConversationInput, setShowNewConversationInput] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [pendingRequestId, setPendingRequestId] = useState<number | null>(null);
  const [currentController, setCurrentController] = useState<AbortController | null>(null);
  
  // Ref for message container to auto-scroll to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<{[key: number]: HTMLDivElement}>({});
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      if (isMobile) {
        setDrawerOpen(false);
      }
    }
  }, [selectedConversation, isMobile]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      
      // After scrolling, ensure focus goes back to input field
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 100);
    }
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await chatApi.getConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      setLoading(true);
      const data = await chatApi.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new function for sending messages with streaming
  const handleSendMessageStreaming = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const userContent = newMessage.trim();
    if (!userContent || sendingMessage) return;
    
    setSendingMessage(true);
    console.log("Starting streaming message request:", userContent);
    
    // Create an AbortController for cancelling the request
    const controller = new AbortController();
    
    try {
      // Add user message to UI immediately with a temporary ID and flag
      const tempUserMessage: TypedMessage = {
        id: Date.now(), // Temporary ID
        role: 'user',
        content: userContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_edited: false,
        edited_at: null,
        isTemporary: true
      };
      
      // Add a temporary thinking message from the assistant
      const tempAssistantMessage: TypedMessage = {
        id: Date.now() + 1, // Another temporary ID
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_edited: false,
        edited_at: null,
        status: 'thinking',
        isTemporary: true
      };
      
      setMessages(prevMessages => [...prevMessages, tempUserMessage, tempAssistantMessage]);
      setNewMessage('');
      
      // Focus back on the input field
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 0);
      
      // Store the abort controller so it can be accessed for cancellation
      const currentRequestId = tempAssistantMessage.id;
      setPendingRequestId(currentRequestId);
      setCurrentController(controller);
      
      console.log("Selected conversation ID:", selectedConversation.id);
      
      chatApi.streamMessage(selectedConversation.id, userContent, {
        onToken: (token, status, isFullUpdate = false) => {
          console.log("Received token:", { token: token.substring(0, 20) + "...", status, isFullUpdate });
          setMessages(prevMessages => {
            // Find the temporary assistant message
            const updatedMessages = [...prevMessages];
            const assistantMessageIndex = updatedMessages.findIndex(
              m => m.id === tempAssistantMessage.id && m.role === 'assistant'
            );
            
            if (assistantMessageIndex !== -1) {
              // If this is a full content update (from agent tool execution)
              if (isFullUpdate) {
                updatedMessages[assistantMessageIndex] = {
                  ...updatedMessages[assistantMessageIndex],
                  content: token, // Replace entire content
                  status: status || 'streaming'
                };
              } else {
                // Update message content with the streaming token
                updatedMessages[assistantMessageIndex] = {
                  ...updatedMessages[assistantMessageIndex],
                  content: isFullUpdate ? token : updatedMessages[assistantMessageIndex].content + token,
                  status: status || 'streaming'
                };
              }
            }
            
            return updatedMessages;
          });
        },
        onComplete: () => {
          console.log("Streaming completed");
          // Mark the message as complete
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            
            // First find our temporary user message and make it permanent
            const userMessageIndex = updatedMessages.findIndex(
              m => m.id === tempUserMessage.id && m.role === 'user'
            );
            
            if (userMessageIndex !== -1) {
              updatedMessages[userMessageIndex] = {
                ...updatedMessages[userMessageIndex],
                isTemporary: false
              };
            }
            
            // Then find our temporary assistant message and make it permanent
            const assistantMessageIndex = updatedMessages.findIndex(
              m => m.id === tempAssistantMessage.id && m.role === 'assistant'
            );
            
            if (assistantMessageIndex !== -1) {
              updatedMessages[assistantMessageIndex] = {
                ...updatedMessages[assistantMessageIndex],
                status: 'complete',
                isTemporary: false
              };
            }
            
            return updatedMessages;
          });
          
          setSendingMessage(false);
          setPendingRequestId(null);
          setCurrentController(null);
          
          // Scroll to the latest message
          scrollToBottom();
        },
        onError: (error) => {
          console.error('Error with stream:', error);
          
          // Mark the message as error
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const assistantMessageIndex = updatedMessages.findIndex(
              m => m.id === tempAssistantMessage.id && m.role === 'assistant'
            );
            
            if (assistantMessageIndex !== -1) {
              updatedMessages[assistantMessageIndex] = {
                ...updatedMessages[assistantMessageIndex],
                content: 'Sorry, there was an error processing your request.',
                status: 'error'
              };
            }
            
            return updatedMessages;
          });
          
          setSendingMessage(false);
          setPendingRequestId(null);
          setCurrentController(null);
        },
        signal: controller.signal
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setSendingMessage(false);
      setPendingRequestId(null);
      setCurrentController(null);
    }
  };

  // Add a function to cancel the current request
  const handleCancelMessage = () => {
    if (currentController) {
      currentController.abort();
      
      // Update the message to show it was cancelled
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages];
        const assistantMessageIndex = updatedMessages.findIndex(
          m => m.id === pendingRequestId && m.role === 'assistant'
        );
        
        if (assistantMessageIndex !== -1) {
          updatedMessages[assistantMessageIndex] = {
            ...updatedMessages[assistantMessageIndex],
            content: updatedMessages[assistantMessageIndex].content + ' (cancelled)',
            status: 'complete'
          };
        }
        
        return updatedMessages;
      });
      
      setSendingMessage(false);
      setPendingRequestId(null);
      setCurrentController(null);
    }
  };

  const handleCreateEmptyConversation = async () => {
    if (loading) return; // Prevent multiple clicks while loading
    
    try {
      setLoading(true);
      // Create a conversation with a default title (will be updated later)
      const conversation = await chatApi.createConversation("New conversation");
      setConversations(prevConversations => [conversation, ...prevConversations]);
      setSelectedConversation(conversation);
      // Focus on the message input to encourage immediate messaging
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    
    try {
      await chatApi.deleteConversation(selectedConversation.id);
      setConversations(prevConversations => 
        prevConversations.filter(c => c.id !== selectedConversation.id)
      );
      setSelectedConversation(conversations.length > 1 ? 
        conversations.find(c => c.id !== selectedConversation.id) || null : null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };
  
  const handleMessageMenuOpen = (event: React.MouseEvent<HTMLElement>, messageId: number) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleMessageMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessageId(null);
  };

  const handleCopyMessage = () => {
    if (selectedMessageId) {
      const message = messages.find(m => m.id === selectedMessageId);
      if (message) {
        navigator.clipboard.writeText(message.content);
      }
    }
    handleMessageMenuClose();
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDateFull = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Function to handle keyboard shortcuts
  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // Ctrl+Enter in text area is already handled by handleKeyDown
    
    // Ctrl+F to open search
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      setSearchOpen(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
    
    // Escape to close search if open, or clear input if not
    if (e.key === 'Escape') {
      if (searchOpen) {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchMatches([]);
        setCurrentMatchIndex(-1);
      } else if (document.activeElement === messageInputRef.current) {
        setNewMessage('');
      }
    }

    // Ctrl+/ to show keyboard shortcuts
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      // Here you could show a modal with keyboard shortcuts
      alert(`
Keyboard Shortcuts:
- Ctrl+Enter: Send message
- Ctrl+F: Open search
- Escape: Close search or clear input
- Ctrl+/: Show this help
- Up/Down arrows in search: Navigate between matches
      `);
    }
  };

  // Function to perform search
  const performSearch = () => {
    if (!searchQuery.trim() || !messages.length) {
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const matches: number[] = [];
    
    messages.forEach((message, index) => {
      if (message.content.toLowerCase().includes(query)) {
        matches.push(index);
      }
    });
    
    setSearchMatches(matches);
    setCurrentMatchIndex(matches.length > 0 ? 0 : -1);
    
    // Scroll to first match
    if (matches.length > 0) {
      setTimeout(() => {
        const firstMatchRef = messageRefs.current[matches[0]];
        if (firstMatchRef) {
          firstMatchRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Navigate to next/previous match
  const navigateMatches = (direction: 'next' | 'prev') => {
    if (searchMatches.length === 0) return;
    
    let newIndex = currentMatchIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % searchMatches.length;
    } else {
      newIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    }
    
    setCurrentMatchIndex(newIndex);
    
    // Scroll to the match
    const matchRef = messageRefs.current[searchMatches[newIndex]];
    if (matchRef) {
      matchRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Add effect for keyboard shortcuts
  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [searchOpen, messages.length]);

  // Effect to perform search when query changes
  useEffect(() => {
    performSearch();
  }, [searchQuery, messages]);

  // Function to highlight search matches in message content
  const highlightMatches = (content: string) => {
    if (!searchQuery.trim()) return content;
    
    const parts = content.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() 
        ? <mark key={i} style={{ backgroundColor: '#FFFF00', padding: 0 }}>{part}</mark> 
        : part
    );
  };

  // Add the handleKeyDown function back for the text input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Enter without shift
    if ((e.key === 'Enter' && e.ctrlKey) || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      handleSendMessageStreaming(e as unknown as React.FormEvent);
    }
    // Shift+Enter will create a new line by default, no need to handle specifically
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', bgcolor: 'background.default' }}>
      {/* Mobile menu button */}
      {isMobile && (
    <Box
      sx={{
            position: 'absolute', 
            top: 12, 
            left: 12, 
            zIndex: 1100 
          }}
        >
          <IconButton 
            onClick={toggleDrawer} 
            color="primary"
            sx={{ 
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.paper' }
            }}
          >
            {drawerOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
      )}
      
      {/* Sidebar with conversations */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : true}
        onClose={isMobile ? toggleDrawer : undefined}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: isMobile ? 2 : 'none',
          },
        }}
      >
        <Box 
          sx={{ 
            width: 280, 
            borderRight: '1px solid', 
            borderColor: 'divider',
            display: 'flex', 
            flexDirection: 'column',
            bgcolor: 'background.paper',
            height: '100%',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Button 
              fullWidth 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleCreateEmptyConversation}
              sx={{ 
                mb: 2,
                py: 1.2,
                borderRadius: 2,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-1px)',
                  transition: 'all 0.2s ease-in-out',
                }
              }}
            >
              New Chat
            </Button>
            
            <Fade in={showNewConversationInput}>
              <Box>
                {showNewConversationInput && (
                  <form onSubmit={handleCreateEmptyConversation}>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      <TextField
                        size="small"
                        placeholder="Chat title"
                        value={newConversationTitle}
                        onChange={(e) => setNewConversationTitle(e.target.value)}
                        fullWidth
                        autoFocus
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton 
                                edge="end" 
                                type="submit"
                                disabled={!newConversationTitle.trim()}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>
                  </form>
                )}
              </Box>
            </Fade>
          </Box>
          
          <Typography
            variant="subtitle2" 
            sx={{
              px: 2, 
              py: 1, 
              color: 'text.secondary',
              fontWeight: 500,
            }}
          >
            Recent Chats
          </Typography>
          
          <List
            sx={{
              width: '100%',
              p: 2,
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: alpha(theme.palette.primary.light, 0.1),
                borderRadius: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.3),
                }
              }
            }}
          >
            {conversations.map((conversation) => (
              <Zoom 
                key={conversation.id} 
                in={true} 
                style={{ 
                  transitionDelay: `${conversations.indexOf(conversation) * 50}ms` 
                }}
              >
                <ListItemButton
                  selected={selectedConversation?.id === conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                      }
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.light, 0.1),
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                      <ElfIcon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={conversation.title}
                    primaryTypographyProps={{
                      noWrap: true,
                      fontWeight: selectedConversation?.id === conversation.id ? 600 : 400
                    }}
                  />
                </ListItemButton>
              </Zoom>
            ))}
            {conversations.length === 0 && !loading && (
              <ListItem sx={{ px: 2 }}>
                <ListItemText 
                  primary="No conversations yet" 
                  primaryTypographyProps={{
                    color: 'text.secondary',
                    fontSize: 14,
                  }}
                />
              </ListItem>
            )}
            {loading && conversations.length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
          </Box>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Main chat area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        bgcolor: 'background.default',
        position: 'relative',
      }}>
        {selectedConversation ? (
          <>
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(45, 125, 84, 0.08)',
              background: 'linear-gradient(135deg, #ffffff 0%, #F6FFF8 100%)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  sx={{ 
                    width: 38, 
                    height: 38, 
                    bgcolor: 'primary.main',
                    border: '2px solid',
                    borderColor: 'secondary.main',
                    boxShadow: '0 2px 8px rgba(45, 125, 84, 0.15)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'rotate(10deg)'
                    }
                  }}
                >
                  <ElfIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    fontSize: '1.1rem',
                    color: 'primary.dark',
                    background: 'linear-gradient(90deg, #1F8A4C 0%, #5BC288 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -2,
                      left: 0,
                      width: '100%',
                      height: '2px',
                      background: 'linear-gradient(90deg, #F0C537 0%, #FFE484 100%)',
                      borderRadius: '2px',
                      transform: 'scaleX(0)',
                      transformOrigin: 'bottom right',
                      transition: 'transform 0.3s ease',
                    },
                    '&:hover::after': {
                      transform: 'scaleX(1)',
                      transformOrigin: 'bottom left',
                    },
                  }}
                >
                  {selectedConversation.title}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tooltip title="Search in conversation">
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      setSearchOpen(true);
                      setTimeout(() => {
                        searchInputRef.current?.focus();
                      }, 100);
                    }}
                    sx={{
                      color: 'primary.main',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        color: 'secondary.main',
                      }
                    }}
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete conversation">
                  <IconButton 
                    size="small" 
                    onClick={handleDeleteConversation}
                    sx={{ 
                      color: 'error.main',
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        bgcolor: 'error.light',
                        transform: 'scale(1.1)',
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Collapse in={searchOpen}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 1, 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                backgroundColor: 'background.paper'
              }}>
                <TextField
                  size="small"
                  placeholder="Search in conversation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  variant="outlined"
                  inputRef={searchInputRef}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {searchMatches.length > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                              {currentMatchIndex + 1} of {searchMatches.length}
                            </Typography>
                          )}
                          <IconButton 
                            size="small" 
                            disabled={searchMatches.length === 0}
                            onClick={() => navigateMatches('prev')}
                          >
                            <KeyboardArrowUpIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            disabled={searchMatches.length === 0}
                            onClick={() => navigateMatches('next')}
                          >
                            <KeyboardArrowDownIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                              setSearchMatches([]);
                              setCurrentMatchIndex(-1);
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ backgroundColor: 'background.paper' }}
                />
              </Box>
            </Collapse>

            <Box
              sx={{
                flex: 1,
                p: 2,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                background: `linear-gradient(rgba(245, 249, 247, 0.9), rgba(245, 249, 247, 0.9)), 
                          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23A3C9B7' stroke-width='1'%3E%3Cpath d='M769 229L1037 260.9M927 880L731 737 520 660 309 538 40 599 295 764 126.5 879.5 40 599-197 493 102 382-31 229 126.5 79.5-69-63'/%3E%3Cpath d='M-31 229L237 261 390 382 603 493 308.5 537.5 101.5 381.5M370 905L295 764'/%3E%3Cpath d='M520 660L578 842 731 737 840 599 603 493 520 660 295 764 309 538 390 382 539 269 769 229 577.5 41.5 370 105 295 -36 126.5 79.5 237 261 102 382 40 599 -69 737 127 880'/%3E%3Cpath d='M520-140L578.5 42.5 731-63M603 493L539 269 237 261 370 105M902 382L539 269M390 382L102 382'/%3E%3Cpath d='M-222 42L126.5 79.5 370 105 539 269 577.5 41.5 927 80 769 229 902 382 603 493 731 737M295-36L577.5 41.5M578 842L295 764M40-201L127 80M102 382L-261 269'/%3E%3C/g%3E%3Cg fill='%23D5E3DC'%3E%3Ccircle cx='769' cy='229' r='5'/%3E%3Ccircle cx='539' cy='269' r='5'/%3E%3Ccircle cx='603' cy='493' r='5'/%3E%3Ccircle cx='731' cy='737' r='5'/%3E%3Ccircle cx='520' cy='660' r='5'/%3E%3Ccircle cx='309' cy='538' r='5'/%3E%3Ccircle cx='295' cy='764' r='5'/%3E%3Ccircle cx='40' cy='599' r='5'/%3E%3Ccircle cx='102' cy='382' r='5'/%3E%3Ccircle cx='127' cy='80' r='5'/%3E%3Ccircle cx='370' cy='105' r='5'/%3E%3Ccircle cx='578' cy='42' r='5'/%3E%3Ccircle cx='237' cy='261' r='5'/%3E%3Ccircle cx='390' cy='382' r='5'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundAttachment: 'fixed',
                backgroundSize: 'cover',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '120px',
                  background: 'linear-gradient(to bottom, rgba(246, 255, 248, 0.9) 0%, rgba(246, 255, 248, 0) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '120px',
                  background: 'linear-gradient(to top, rgba(246, 255, 248, 0.9) 0%, rgba(246, 255, 248, 0) 100%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                },
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha(theme.palette.primary.light, 0.1),
                  borderRadius: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  }
                }
              }}
            >
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto', 
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}>
                {messages.map((message, index) => (
                  <Fade 
                    key={message.id} 
                    in={true} 
                    timeout={300}
                    style={{ 
                      transitionDelay: `${index * 100}ms` 
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 2,
                        maxWidth: '850px',
                        mx: 'auto',
                        width: '100%',
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: message.role === 'user' ? 'secondary.main' : 'primary.main',
                          width: 40,
                          height: 40,
                          border: '2px solid',
                          borderColor: message.role === 'user' ? 'secondary.light' : 'primary.light',
                          boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: message.role === 'user' ? 'rotate(-5deg)' : 'rotate(5deg)',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
                          }
                        }}
                      >
                        {message.role === 'user' ? <PersonIcon /> : <ElfIcon />}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          mb: 0.5,
                          justifyContent: 'space-between'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {message.role === 'user' ? 'You' : 'Elf'}
                            </Typography>
                            <Tooltip title={formatDateFull(message.created_at)}>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ ml: 1 }}
                              >
                                {formatDate(message.created_at)}
                                {message.is_edited && ' (edited)'}
                          </Typography>
                            </Tooltip>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMessageMenuOpen(e, message.id)}
                            sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Paper
                          elevation={0}
                          ref={(el) => {
                            if (el) {
                              messageRefs.current[index] = el;
                            }
                          }}
                          sx={{
                            p: 2,
                            mb: 2,
                            backgroundColor: message.role === 'user' 
                              ? alpha(theme.palette.secondary.light, 0.15)
                              : alpha(theme.palette.primary.light, 0.15),
                            borderRadius: message.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                            ml: message.role === 'user' ? 'auto' : 2,
                            mr: message.role === 'user' ? 2 : 'auto',
                            maxWidth: '85%',
                            position: 'relative',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            backgroundImage: message.role === 'assistant' ? 
                              'linear-gradient(135deg, rgba(31, 138, 76, 0.08) 0%, rgba(91, 194, 136, 0.12) 100%)' : 
                              'linear-gradient(135deg, rgba(240, 197, 55, 0.08) 0%, rgba(255, 228, 132, 0.12) 100%)',
                            border: `1px solid ${message.role === 'user' 
                              ? alpha(theme.palette.secondary.main, 0.15) 
                              : alpha(theme.palette.primary.main, 0.15)}`,
                            '&:hover': {
                              boxShadow: '0 5px 15px rgba(0,0,0,0.12)',
                              transform: 'translateY(-3px)',
                              backgroundColor: message.role === 'user' 
                                ? alpha(theme.palette.secondary.light, 0.2)
                                : alpha(theme.palette.primary.light, 0.2),
                              borderColor: message.role === 'user' 
                                ? alpha(theme.palette.secondary.main, 0.3)
                                : alpha(theme.palette.primary.main, 0.3)
                            },
                            ...(searchMatches.length > 0 && 
                               index === searchMatches[currentMatchIndex] && {
                              boxShadow: `0 0 0 3px ${theme.palette.secondary.main}, 0 5px 15px rgba(0,0,0,0.1)`,
                              transform: 'translateY(-3px) scale(1.02)',
                              transition: 'all 0.3s ease',
                            }),
                          }}
                        >
                          {/* Message content */}
                          {message.role === 'assistant' && (message.status === 'thinking' || message.status === 'streaming') && (
                             <Box sx={{ 
                               display: 'flex',
                               justifyContent: 'space-between',
                               alignItems: 'center',
                               width: '100%'
                             }}>
                               <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                 {message.status === 'thinking' ? (
                                   <Box
                                     sx={{
                                       display: 'flex',
                                       columnGap: '4px',
                                       '& .dot': {
                                         width: '8px',
                                         height: '8px',
                                         backgroundColor: theme.palette.primary.main,
                                         borderRadius: '50%',
                                         animation: 'bounce 1.4s infinite ease-in-out both',
                                         '&:nth-of-type(1)': {
                                           animationDelay: '-0.32s'
                                         },
                                         '&:nth-of-type(2)': {
                                           animationDelay: '-0.16s'
                                         }
                                       },
                                       '@keyframes bounce': {
                                         '0%, 80%, 100%': {
                                           transform: 'scale(0)'
                                         },
                                         '40%': {
                                           transform: 'scale(1)'
                                         }
                                       }
                                     }}
                                   >
                                     <span className="dot"></span>
                                     <span className="dot"></span>
                                     <span className="dot"></span>
                                   </Box>
                                 ) : null}
                                 <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                   {message.status === 'thinking' ? 'Thinking...' : 'Generating...'}
                                 </Typography>
                               </Box>
                               
                               {message.id === pendingRequestId && (
                                 <IconButton 
                                   size="small" 
                                   onClick={handleCancelMessage}
                                   sx={{ 
                                     color: 'error.main',
                                     opacity: 0.7,
                                     '&:hover': { 
                                       opacity: 1,
                                       backgroundColor: alpha(theme.palette.error.main, 0.1)
                                     }
                                   }}
                                 >
                                   <CloseIcon fontSize="small" />
                                 </IconButton>
                               )}
                             </Box>
                           )}
                           
                           {/* Add back the message content display for normal messages */}
                           {(!message.status || message.status === 'complete' || message.status === 'error') && (
                             <MarkdownPreview
                               source={
                                 typeof message.content === 'string' && searchQuery.trim() 
                                   ? message.content.replace(
                                       new RegExp(`(${searchQuery})`, 'gi'), 
                                       match => `**~~${match}~~**`
                                     )
                                   : message.content
                               }
                               style={{ 
                                 background: 'transparent',
                                 fontFamily: 'inherit',
                                 fontSize: 'inherit',
                                 color: 'inherit'
                               }}
                             />
                           )}
                           
                           {/* Display streaming messages with cursor */}
                           {message.status === 'streaming' && (
                             <Box sx={{ position: 'relative' }}>
                               <MarkdownPreview
                                 source={
                                   typeof message.content === 'string' && searchQuery.trim() 
                                     ? message.content.replace(
                                         new RegExp(`(${searchQuery})`, 'gi'), 
                                         match => `**~~${match}~~**`
                                       )
                                     : message.content
                                 }
                                 style={{ 
                                   background: 'transparent',
                                   fontFamily: 'inherit',
                                   fontSize: 'inherit',
                                   color: 'inherit'
                                 }}
                               />
                               <Box 
                                 sx={{ 
                                   display: 'inline-flex',
                                   position: 'relative',
                                   ml: 1
                                 }}
                               >
                                 <Box sx={{ 
                                   height: '16px',
                                   width: '2px',
                                   backgroundColor: theme.palette.primary.main,
                                   display: 'inline-block',
                                   animation: 'blink 1.2s step-end infinite',
                                   '@keyframes blink': {
                                     '0%, 100%': { opacity: 1 },
                                     '50%': { opacity: 0 }
                                   }
                                 }} />
                               </Box>
                             </Box>
                           )}
                        </Paper>
                      </Box>
                    </Box>
                  </Fade>
                ))}
                
                {messages.length === 0 && !loading && (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: 2,
                  }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        width: 64,
                        height: 64,
                      }}
                    >
                      <ElfLogoIcon sx={{ fontSize: 36 }} />
                    </Avatar>
                    <Typography variant="h6" align="center" color="text.primary">
                      Welcome to Elf AI
                    </Typography>
                    <Typography align="center" color="text.secondary" sx={{ maxWidth: 450 }}>
                      Your magical AI assistant for meaningful conversations
                    </Typography>
                  </Box>
                )}
                
                {loading && messages.length === 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%' 
                  }}>
                    <CircularProgress />
                </Box>
                )}
                
                <div ref={messagesEndRef} />
              </Box>
            </Box>

            <Box sx={{ 
              p: 2, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              bgcolor: 'background.paper',
              position: 'sticky',
              bottom: 0,
              zIndex: 10,
              boxShadow: '0 -4px 12px rgba(45, 125, 84, 0.08)',
              background: 'linear-gradient(135deg, #ffffff 0%, #F6FFF8 100%)',
            }}>
              <form onSubmit={handleSendMessageStreaming}>
                <Box 
          sx={{
            display: 'flex',
                    maxWidth: '850px',
                    mx: 'auto',
          }}
        >
          <TextField
            fullWidth
            multiline
                    minRows={1}
            maxRows={4}
                    variant="outlined"
            placeholder="Ask the Elf AI anything..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sendingMessage}
            inputRef={messageInputRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {pendingRequestId ? (
                    <IconButton
                      onClick={handleCancelMessage}
                      sx={{ 
                        color: 'error.main',
                        transition: 'all 0.2s ease',
                        mr: 1,
                        '&:hover': { 
                          transform: 'scale(1.1)',
                          color: 'error.dark',
                        }
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  ) : null}
                  <IconButton
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    sx={{ 
                      color: 'primary.main',
                      transition: 'all 0.3s ease',
                      animation: newMessage.trim() ? 'pulse 2s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': {
                          transform: 'scale(1)',
                          boxShadow: '0 0 0 0 rgba(31, 138, 76, 0.4)'
                        },
                        '70%': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 0 0 10px rgba(31, 138, 76, 0)'
                        },
                        '100%': {
                          transform: 'scale(1)',
                          boxShadow: '0 0 0 0 rgba(31, 138, 76, 0)'
                        }
                      },
                      '&:hover': { 
                        transform: 'scale(1.2) rotate(10deg)',
                        color: 'secondary.main',
                        backgroundColor: alpha(theme.palette.primary.light, 0.1)
                      }
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 20,
                backgroundColor: 'background.paper',
                boxShadow: '0 3px 10px rgba(45, 125, 84, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 5px 15px rgba(45, 125, 84, 0.15)',
                  transform: 'translateY(-2px)'
                },
                '&.Mui-focused': {
                  boxShadow: '0 5px 15px rgba(45, 125, 84, 0.15), 0 0 0 2px rgba(31, 138, 76, 0.2)',
                  transform: 'translateY(-2px)'
                }
              }
            }}
            sx={{ mb: 1 }}
          />
                </Box>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mt: 1,
                    opacity: 0.7,
                    '&:hover': { opacity: 1 }
                  }}
                >
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <span style={{ color: theme.palette.primary.main }}>✧</span> 
                    Press Ctrl+Enter to send 
                    <span style={{ color: theme.palette.primary.main }}>✧</span>
                  </Typography>
                </Box>
              </form>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 3,
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 80,
                height: 80,
                border: '3px solid',
                borderColor: 'secondary.main',
                boxShadow: '0 8px 32px rgba(45, 125, 84, 0.25)',
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-10px)' },
                  '100%': { transform: 'translateY(0px)' }
                }
              }}
            >
              <ElfLogoIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography 
              variant="h5" 
              color="text.primary"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(90deg, #1F8A4C 0%, #5BC288 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                textShadow: '0 2px 10px rgba(45, 125, 84, 0.2)',
              }}
            >
              Welcome to Elf AI
            </Typography>
            <Typography 
              color="text.secondary" 
              align="center" 
              sx={{ 
                maxWidth: 500,
                fontWeight: 500,
                lineHeight: 1.6,
                px: 3,
                pb: 2,
                borderBottom: '2px dashed',
                borderColor: alpha(theme.palette.primary.main, 0.2),
                marginBottom: 3,
              }}
            >
              Your magical AI assistant for meaningful conversations.
              Ask me anything and I'll do my best to help!
            </Typography>
            {!loading && conversations.length === 0 && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleCreateEmptyConversation}
                sx={{
                  mt: 2,
                  py: 1.2,
                  px: 3,
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out',
                  }
                }}
              >
                New Chat
              </Button>
            )}
          </Box>
        )}
      </Box>
      
      {/* Message menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMessageMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleCopyMessage}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Copy message
        </MenuItem>
      </Menu>
    </Box>
  );
}; 