import { createTheme } from '@mui/material/styles';

// Enhanced Elf AI theme colors
const elfGreen = {
  main: '#1F8A4C', // Brighter forest green
  light: '#5BC288',
  dark: '#0F5E30',
  contrastText: '#ffffff',
};

const elfGold = {
  main: '#F0C537', // Brighter gold
  light: '#FFE484',
  dark: '#D4A520',
  contrastText: '#000000',
};

// Add more elf-themed colors
const elfRed = {
  main: '#E74C3C', // Festive red
  light: '#FF7675',
  dark: '#C0392B',
};

const elfIce = {
  main: '#A2D5F2', // Ice blue
  light: '#CCEAFF',
  dark: '#7CBED6',
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: elfGreen,
    secondary: elfGold,
    error: elfRed,
    info: elfIce,
    background: {
      default: '#F6FFF8', // Lighter mint green background
      paper: '#ffffff',
    },
    text: {
      primary: '#2A3B31', // Dark forest green
      secondary: '#546A5E', // Medium forest green
    },
    divider: 'rgba(45, 125, 84, 0.1)', // Slightly green-tinted dividers
  },
  typography: {
    fontFamily: '"Quicksand", "Nunito", "Comfortaa", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.25px',
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.15px',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
    subtitle1: {
      letterSpacing: '0.1px',
    },
    subtitle2: {
      letterSpacing: '0.1px',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 16, // Even more rounded corners for more playful elf-like aesthetics
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          borderRadius: 20, // Pill-shaped buttons
          padding: '8px 16px',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(45, 125, 84, 0.15)',
            transform: 'translateY(-3px)',
            transition: 'all 0.3s ease-in-out',
          },
        },
        contained: {
          boxShadow: '0 2px 6px rgba(45, 125, 84, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 15px rgba(45, 125, 84, 0.2)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0px 3px 10px rgba(0, 0, 0, 0.07)',
        },
        elevation2: {
          boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.09)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(45, 125, 84, 0.2)',
              borderWidth: 2,
              transition: 'all 0.3s ease-in-out',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(45, 125, 84, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: elfGreen.main,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: elfGreen.main,
          boxShadow: '0 2px 8px rgba(45, 125, 84, 0.15)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(45, 125, 84, 0.9)',
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '6px 12px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(45, 125, 84, 0.08)',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(45, 125, 84, 0.12)',
          },
        },
      },
    },
  },
}); 