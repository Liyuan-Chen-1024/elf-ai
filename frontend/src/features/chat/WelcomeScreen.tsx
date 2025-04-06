import { useConversations } from "../../hooks/useChat";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { useState } from 'react';

function WelcomeScreen() {
    const navigate = useNavigate();
    const { createConversation, isLoading } = useConversations();
    const [error, setError] = useState<string | null>(null);

    const handleNewChat = async () => {
        setError(null);
        try {
            const newConversation = await createConversation({ title: 'New Conversation' });
            if (newConversation?.id) {
                navigate(`/chat/${newConversation.id}`);
            } else {
                setError('Failed to create conversation - invalid response');
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
            setError('Failed to create conversation. Please try again.');
        }
    };
    
    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 2
        }}>
            <Typography variant="h5">Welcome to Chat</Typography>
            
            {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Button 
                variant="contained" 
                onClick={handleNewChat}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
                {isLoading ? 'Creating...' : 'Start New Conversation! :)'}
            </Button>
        </Box>
    );
}

export default WelcomeScreen; 
