import { Box, keyframes, styled, Typography, useTheme } from '@mui/material';

// Define keyframe animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const rotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Styled components
const LogoContainer = styled(Box)`
  display: flex;
  align-items: center;
  position: relative;
`;

const MagicWand = styled('div')`
  position: absolute;
  top: -5px;
  right: -10px;
  font-size: 16px;
  animation: ${float} 3s ease-in-out infinite;
  transform-origin: bottom left;
`;

const LogoText = styled(Typography)`
  background: linear-gradient(90deg, #00CEAC, #7B68EE, #00CEAC);
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ${shimmer} 6s linear infinite;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const ElfIcon = styled('div')`
  position: relative;
  width: 32px;
  height: 32px;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  animation: ${pulse} 3s ease-in-out infinite;
  overflow: hidden;
`;

const MagicCircle = styled('div')`
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px dashed;
  opacity: 0.3;
  animation: ${rotate} 10s linear infinite;
`;

interface AnimatedLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export const AnimatedLogo = ({ size = 'medium' }: AnimatedLogoProps) => {
  const theme = useTheme();
  
  // Size configurations
  const sizes = {
    small: {
      fontSize: '1.25rem',
      iconSize: 24,
      magicWandSize: 12,
    },
    medium: {
      fontSize: '1.5rem',
      iconSize: 32,
      magicWandSize: 16,
    },
    large: {
      fontSize: '2rem',
      iconSize: 48,
      magicWandSize: 20,
    },
  };
  
  const { fontSize, iconSize, magicWandSize } = sizes[size];

  return (
    <LogoContainer>
      <ElfIcon
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
          boxShadow: `0 2px 8px ${theme.palette.primary.main}30`,
          width: iconSize,
          height: iconSize,
        }}
      >
        <MagicCircle 
          sx={{ 
            borderColor: theme.palette.background.paper,
          }} 
        />
        <Typography
          variant="h6"
          sx={{
            color: 'white',
            fontSize: iconSize * 0.5,
            fontWeight: 'bold',
            zIndex: 1,
          }}
        >
          E
        </Typography>
      </ElfIcon>
      
      <LogoText
        variant="h6"
        sx={{
          fontSize,
        }}
      >
        ElfAI
      </LogoText>
      
      <MagicWand
        sx={{
          fontSize: magicWandSize,
          animationDelay: '0.5s',
        }}
      >
        ✨
      </MagicWand>
    </LogoContainer>
  );
}; 