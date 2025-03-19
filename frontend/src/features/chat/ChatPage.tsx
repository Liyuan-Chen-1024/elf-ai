import React from 'react';
import { Box, TextField, Typography, Paper } from '@mui/material';
import { useChatStore } from './store/chatStore';

export function ChatPage() {
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    sendMessage,
  } = useChatStore();

  const handleSubmit = (event: { preventDefault: () => void; currentTarget: HTMLFormElement }) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem('message') as HTMLInputElement;
    if (input.value.trim()) {
      handleSendMessage(input.value);
      input.value = '';
    }
  };

  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
        {messages.map((message) => (
          <Paper
            key={message.id}
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: message.sender?.id === 'user' ? 'primary.light' : 'background.paper',
            }}
          >
            {message.showThinking && message.thinkingContent ? (
              <Typography variant="body1" color="text.secondary">
                {message.thinkingContent}
              </Typography>
            ) : (
              <Typography variant="body1">
                {message.content}
              </Typography>
            )}
          </Paper>
        ))}
      </Box>
      {isLoading && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Loading...
        </Typography>
      )}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          name="message"
          placeholder="Type your message..."
          variant="outlined"
          size="small"
        />
      </Box>
    </Box>
  );
}
