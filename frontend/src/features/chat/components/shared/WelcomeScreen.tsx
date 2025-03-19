import AddIcon from '@mui/icons-material/Add';
import EmojiNatureIcon from '@mui/icons-material/EmojiNature';
import MenuIcon from '@mui/icons-material/Menu';
import {
    alpha,
    Box,
    Button,
    IconButton,
    Paper,
    Tooltip,
    Typography,
    useTheme
} from '@mui/material';
import { useState } from 'react';

interface WelcomeScreenProps {
  drawerOpen: boolean;
  isMobile: boolean;
  handleDrawerToggle: () => void;
  createConversation: (title: string) => void;
}

export function WelcomeScreen({
  drawerOpen,
  isMobile,
  handleDrawerToggle,
  createConversation
}: WelcomeScreenProps) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  
  return (
    <div>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '90vh',
          p: 3,
          textAlign: 'center',
        }}
      >
        {/* Mobile menu toggle */}
        {isMobile && !drawerOpen && (
          <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
            <Tooltip title="Open chat list">
              <IconButton
                onClick={handleDrawerToggle}
                edge="start"
                aria-label="menu"
                sx={{
                  color: theme.palette.text.secondary,
                  opacity: 0.9,
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  },
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Logo and welcome text */}
        <Box sx={{ mb: 6 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: '0 8px 32px rgba(0, 206, 172, 0.20)',
            }}
          >
            <EmojiNatureIcon sx={{ fontSize: 48, color: '#fff' }} />
          </Box>
          <Typography variant="h4" component="h1" fontWeight="bold" sx={{ mb: 1 }}>
            Welcome to ElfAI
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, maxWidth: 500, mx: 'auto' }}>
            Your intelligent companion for seamless conversations.
          </Typography>
        </Box>

        {/* Action buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mt: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => createConversation('New Conversation')}
            sx={{
              py: 1.5,
              px: 3,
              borderRadius: 28,
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(0, 206, 172, 0.30)',
              backgroundColor: '#00CEAC',
              '&:hover': {
                backgroundColor: '#00B597',
                boxShadow: '0 6px 20px rgba(0, 206, 172, 0.40)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Start a New Conversation
          </Button>
        </Box>

        {/* Feature cards */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            mt: 8,
            maxWidth: 900,
            width: '100%',
          }}
        >
          <FeatureCard
            title="Chat Naturally"
            description="Have fluid conversations with ElfAI's advanced natural language understanding."
            icon="🧠"
          />
          <FeatureCard
            title="Get Assistance"
            description="Ask questions, get information, and solve problems with helpful AI responses."
            icon="💡"
          />
          <FeatureCard
            title="Save History"
            description="Your conversations are saved so you can easily refer back to them later."
            icon="📚"
          />
        </Box>
      </Box>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  const theme = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(8px)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        },
      }}
    >
      <Typography variant="h1" sx={{ fontSize: '2rem', mb: 1 }}>
        {icon}
      </Typography>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Paper>
  );
} 