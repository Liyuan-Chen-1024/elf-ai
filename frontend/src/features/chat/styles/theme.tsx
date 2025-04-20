import { keyframes } from '@mui/material';
import userAvatar from '../../../assets/avatars/human-user.svg';
import assistantAvatar from '../../../assets/avatars/elf-robot.svg';

// Animations
export const animations = {
  pulse: keyframes`
    0% { box-shadow: 0 0 0 0 rgba(124, 77, 255, 0.4); background-color: transparent !important; }
    70% { box-shadow: 0 0 0 10px rgba(124, 77, 255, 0); background-color: transparent !important; }
    100% { box-shadow: 0 0 0 0 rgba(124, 77, 255, 0); background-color: transparent !important; }
  `,
  float: keyframes`
    0% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
    100% { transform: translateY(0px); }
  `,
  blink: keyframes`
    0%, 100% { opacity: 0.8; }
    50% { opacity: 0.2; }
  `
};

// Theme constants
export const THEME = {
  colors: {
    primary: {
      main: '#7C4DFF',
      light: '#9D7FFF',
      gradient: 'linear-gradient(135deg, #7C4DFF 0%, #FF7597 100%)',
      hoverGradient: 'linear-gradient(135deg, #6a3fcf 0%, #e76485 100%)',
    },
    text: {
      primary: '#1C1C1E',
      secondary: '#6C6C70',
      muted: 'rgba(28, 28, 30, 0.5)',
      completed: '#5E35B1',
    },
    background: {
      // Message backgrounds
      user: 'rgba(124, 77, 255, 0.1)',
      assistant: 'transparent',
      system: 'rgba(0, 122, 255, 0.05)', 
      
      // UI elements
      surface: '#FFFFFF',
      header: 'linear-gradient(180deg, rgba(247, 249, 252, 0.9) 0%, rgba(247, 249, 252, 0.6) 100%)',
      headerBorder: 'linear-gradient(90deg, rgba(124, 77, 255, 0.08) 0%, rgba(255, 117, 151, 0.08) 100%)',
      inputBorder: 'rgba(0, 0, 0, 0.08)',
      
      // For backward compatibility
      default: '#f6f6f6',
      paper: '#ffffff',
    },
    accent: {
      purple: {
        light: 'rgba(124, 77, 255, 0.04)',
        border: 'rgba(124, 77, 255, 0.12)',
        main: '#7C4DFF',
        shadow: '0 2px 6px rgba(124, 77, 255, 0.3)',
      },
      blue: {
        light: 'rgba(0, 122, 255, 0.04)',
        border: 'rgba(0, 122, 255, 0.12)',
      },
      red: {
        light: 'rgba(255, 59, 48, 0.05)',
        border: 'rgba(255, 59, 48, 0.12)',
        main: '#FF3B30',
      }
    }
  },
  avatars: {
    user: userAvatar,
    assistant: assistantAvatar,
  },
  shadows: {
    header: '0 1px 0 rgba(0, 0, 0, 0.06)',
    container: '0 4px 24px rgba(0, 0, 0, 0.04)',
  },
  blur: {
    strong: 'blur(20px)',
    subtle: 'blur(12px)',
  },
  layout: {
    headerHeight: '70px',
    contentHeight: 'calc(100vh - 70px)',
    sidebarWidth: '220px',
    inputMaxHeight: '100px',
    inputMinHeight: '50px',
    maxContentWidth: '1200px',
  },
  typography: {
    fontSize: {
      tiny: '0.75rem',      // 12px
      small: '0.875rem',    // 14px
      regular: '0.9375rem', // 15px
      large: '1.25rem',     // 20px
      xlarge: '1.8rem',     // 28.8px
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
    spacing: {
      tight: '-0.01em', 
      tighter: '-0.02em',
    }
  },
  animations
};

export default THEME; 