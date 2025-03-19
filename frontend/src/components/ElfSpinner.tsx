import { Box, CircularProgress, keyframes, styled, Typography } from '@mui/material';

const float = keyframes`
  0% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-5px) rotate(5deg); }
  50% { transform: translateY(0px) rotate(0deg); }
  75% { transform: translateY(5px) rotate(-5deg); }
  100% { transform: translateY(0px) rotate(0deg); }
`;

const glow = keyframes`
  0% { filter: drop-shadow(0 0 2px rgba(0, 206, 172, 0.4)); }
  50% { filter: drop-shadow(0 0 8px rgba(0, 206, 172, 0.6)); }
  100% { filter: drop-shadow(0 0 2px rgba(0, 206, 172, 0.4)); }
`;

const FloatingEIcon = styled('div')(({ theme }) => ({
  width: 50,
  height: 50,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 26,
  animation: `${float} 3s ease-in-out infinite, ${glow} 2s ease-in-out infinite`,
  marginBottom: 16,
  position: 'relative',
  boxShadow: '0 4px 12px rgba(0, 206, 172, 0.3)',
}));

const SpinnerContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  background: theme.palette.background.default,
  zIndex: 1200,
}));

const magicCircle = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const MagicCircle = styled('div')(({ theme }) => ({
  position: 'absolute',
  width: 70,
  height: 70,
  borderRadius: '50%',
  border: `2px dashed ${theme.palette.primary.light}`,
  opacity: 0.5,
  animation: `${magicCircle} 8s linear infinite`,
}));

interface ElfSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export const ElfSpinner = ({ message = 'Loading magic...', fullPage = true }: ElfSpinnerProps) => {
  return (
    <SpinnerContainer 
      sx={{ 
        position: fullPage ? 'fixed' : 'absolute',
        height: fullPage ? '100vh' : '100%',
      }}
    >
      <FloatingEIcon>
        <MagicCircle />
        E
      </FloatingEIcon>
      <Typography 
        variant="h6" 
        sx={{ 
          color: 'primary.main', 
          background: '-webkit-linear-gradient(45deg, #00CEAC, #7B68EE)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          marginBottom: 2
        }}
      >
        {message}
      </Typography>
      <CircularProgress 
        size={30} 
        thickness={4} 
        sx={{ 
          color: 'primary.main',
          opacity: 0.7,
        }} 
      />
    </SpinnerContainer>
  );
}; 