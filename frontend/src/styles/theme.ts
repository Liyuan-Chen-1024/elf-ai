import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Create a custom theme with ElfAI branding
const baseTheme = createTheme({
  palette: {
    primary: {
      main: '#6D5AE6',
      light: '#9C8DFF',
      dark: '#4D3BB5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#37C9B9',
      light: '#62EFE2',
      dark: '#21A095',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8F9FE',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1650',
      secondary: '#6B6E8D',
      disabled: '#AEB2CD',
    },
    divider: '#EBEDF5',
    success: {
      main: '#38D9A9',
      light: '#6EFFCE',
      dark: '#24AC84',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#5698FF',
      light: '#82C0FF',
      dark: '#2D6DD8',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFC452',
      light: '#FFD47E',
      dark: '#DFA23B',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF5C93',
      light: '#FF8CB6',
      dark: '#D33068',
      contrastText: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.375,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.375,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.375,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.375,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.375,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.375,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(29, 22, 179, 0.05)',
    '0px 4px 8px rgba(29, 22, 179, 0.07)',
    '0px 6px 12px rgba(29, 22, 179, 0.08)',
    '0px 8px 16px rgba(29, 22, 179, 0.09)',
    '0px 10px 20px rgba(29, 22, 179, 0.10)',
    '0px 12px 24px rgba(29, 22, 179, 0.11)',
    '0px 14px 28px rgba(29, 22, 179, 0.12)',
    '0px 16px 32px rgba(29, 22, 179, 0.13)',
    '0px 18px 36px rgba(29, 22, 179, 0.14)',
    '0px 20px 40px rgba(29, 22, 179, 0.15)',
    '0px 22px 44px rgba(29, 22, 179, 0.16)',
    '0px 24px 48px rgba(29, 22, 179, 0.17)',
    '0px 26px 52px rgba(29, 22, 179, 0.18)',
    '0px 28px 56px rgba(29, 22, 179, 0.19)',
    '0px 30px 60px rgba(29, 22, 179, 0.20)',
    '0px 32px 64px rgba(29, 22, 179, 0.21)',
    '0px 34px 68px rgba(29, 22, 179, 0.22)',
    '0px 36px 72px rgba(29, 22, 179, 0.23)',
    '0px 38px 76px rgba(29, 22, 179, 0.24)',
    '0px 40px 80px rgba(29, 22, 179, 0.25)',
    '0px 42px 84px rgba(29, 22, 179, 0.26)',
    '0px 44px 88px rgba(29, 22, 179, 0.27)',
    '0px 46px 92px rgba(29, 22, 179, 0.28)',
    '0px 48px 96px rgba(29, 22, 179, 0.29)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '12px',
          fontWeight: 600,
          boxShadow: '0px 4px 12px rgba(109, 90, 230, 0.15)',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 8px 16px rgba(109, 90, 230, 0.2)',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #EBEDF5',
        },
        elevation1: {
          boxShadow: '0px 4px 12px rgba(29, 22, 179, 0.08)',
        },
        elevation2: {
          boxShadow: '0px 6px 16px rgba(29, 22, 179, 0.10)',
        },
        elevation4: {
          boxShadow: '0px 8px 24px rgba(29, 22, 179, 0.12)',
        },
        elevation8: {
          boxShadow: '0px 12px 32px rgba(29, 22, 179, 0.14)',
        },
        elevation16: {
          boxShadow: '0px 16px 40px rgba(29, 22, 179, 0.16)',
        },
        elevation24: {
          boxShadow: '0px 20px 48px rgba(29, 22, 179, 0.18)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 20px rgba(29, 22, 179, 0.1)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 6,
        },
      },
    },
  },
});

// Apply responsive font sizes
const theme = responsiveFontSizes(baseTheme);

export default theme;
