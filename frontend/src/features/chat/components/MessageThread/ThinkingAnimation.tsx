import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Main container
const ThinkingWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
}));

// Dots animation container
const DotsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: theme.spacing(0.5),
}));

// Individual dot with pulsing animation
const Dot = styled('span')(({ theme, delay }) => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  margin: theme.spacing(0, 0.3),
  opacity: 0.6,
  display: 'inline-block',
  animation: 'pulse 1.5s infinite ease-in-out',
  animationDelay: `${delay}ms`,
  '@keyframes pulse': {
    '0%, 100%': {
      transform: 'scale(0.8)',
      opacity: 0.5,
    },
    '50%': {
      transform: 'scale(1.2)',
      opacity: 0.9,
    },
  },
}));

// Words that will rotate to simulate thinking
const thinkingWords = [
  'Analyzing',
  'Processing',
  'Considering',
  'Evaluating',
  'Examining',
];

interface ThinkingAnimationProps {
  speed?: number; // Speed of word rotation in milliseconds
}

export const ThinkingAnimation = ({ speed = 1200 }: ThinkingAnimationProps) => {
  const [currentWord, setCurrentWord] = useState(0);
  
  useEffect(() => {
    // Rotate through thinking words
    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % thinkingWords.length);
    }, speed);
    
    return () => {
      clearInterval(wordInterval);
    };
  }, [speed]);
  
  return (
    <ThinkingWrapper>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
            color: 'text.primary',
          }}
        >
          Thinking
        </Typography>
        <DotsContainer>
          <Dot delay={0} />
          <Dot delay={200} />
          <Dot delay={400} />
        </DotsContainer>
      </Box>
      
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'text.secondary',
          opacity: 0.8,
          fontStyle: 'italic',
          mt: 1,
          transition: 'opacity 0.3s ease',
        }}
      >
        {thinkingWords[currentWord]}
      </Typography>
    </ThinkingWrapper>
  );
}; 