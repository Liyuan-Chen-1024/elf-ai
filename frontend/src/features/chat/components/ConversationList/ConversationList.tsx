import {
    Box,
    Divider,
    List,
    Typography,
    useTheme
} from '@mui/material';
import type { Conversation } from '../../types';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | number | null | undefined;
  onSelectConversation: (id: string | number) => void;
  onCreateConversation: (title: string) => void;
  onRenameConversation?: (id: string, title: string) => void;
  onDeleteConversation?: (id: string) => void;
  onCreateNewChat?: () => void;
}

export const ConversationList = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  onRenameConversation,
  onDeleteConversation,
  onCreateNewChat
}: ConversationListProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {/* Divider with label */}
      <Divider textAlign="left" sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary">
          YOUR CONVERSATIONS
        </Typography>
      </Divider>
      
      {/* Conversation list */}
      <Box sx={{ flex: 1, overflow: 'auto', pt: 1 }}>
        {conversations.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No conversations yet. Start a new chat!
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {/* Sort conversations to have newest first based on updatedAt */}
            {[...conversations]
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={String(conversation.id) === String(currentConversationId)}
                  onClick={() => onSelectConversation(conversation.id)}
                  onRename={onRenameConversation ? 
                    (title) => onRenameConversation(String(conversation.id), title) : 
                    undefined
                  }
                  onDelete={onDeleteConversation ? 
                    () => onDeleteConversation(String(conversation.id)) : 
                    undefined
                  }
                />
              ))}
          </List>
        )}
      </Box>
    </Box>
  );
}; 