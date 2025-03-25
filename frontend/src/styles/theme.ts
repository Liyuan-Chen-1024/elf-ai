import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// Create a custom theme with ElfAI branding
const baseTheme = createTheme({
  palette: {
    primary: {
      main: '#5048E5',
      light: '#828DF8',
      dark: '#3832A0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981',
      light: '#3FC79A',
      dark: '#0B815A',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F9FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#121828',
      secondary: '#65748B',
      disabled: '#A1A9C4',
    },
    divider: '#E6E8F0',
    success: {
      main: '#14B8A6',
      light: '#43C6B7',
      dark: '#0E8074',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#2196F3',
      light: '#64B6F7',
      dark: '#0B79D0',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFB020',
      light: '#FFBF4C',
      dark: '#B27B16',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D14343',
      light: '#DA6868',
      dark: '#922E2E',
      contrastText: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.08)',
    '0px 1px 5px rgba(0, 0, 0, 0.08)',
    '0px 1px 8px rgba(0, 0, 0, 0.08)',
    '0px 1px 10px rgba(0, 0, 0, 0.12)',
    '0px 2px 4px rgba(0, 0, 0, 0.08)',
    '0px 3px 5px rgba(0, 0, 0, 0.08)',
    '0px 3px 8px rgba(0, 0, 0, 0.08)',
    '0px 4px 10px rgba(0, 0, 0, 0.12)',
    '0px 5px 12px rgba(0, 0, 0, 0.08)',
    '0px 5px 15px rgba(0, 0, 0, 0.08)',
    '0px 6px 15px rgba(0, 0, 0, 0.12)',
    '0px 7px 15px rgba(0, 0, 0, 0.12)',
    '0px 8px 15px rgba(0, 0, 0, 0.12)',
    '0px 9px 20px rgba(0, 0, 0, 0.12)',
    '0px 10px 20px rgba(0, 0, 0, 0.12)',
    '0px 10px 25px rgba(0, 0, 0, 0.16)',
    '0px 12px 25px rgba(0, 0, 0, 0.16)',
    '0px 14px 30px rgba(0, 0, 0, 0.2)',
    '0px 16px 35px rgba(0, 0, 0, 0.2)',
    '0px 18px 40px rgba(0, 0, 0, 0.24)',
    '0px 20px 45px rgba(0, 0, 0, 0.24)',
    '0px 22px 50px rgba(0, 0, 0, 0.28)',
    '0px 24px 55px rgba(0, 0, 0, 0.32)',
    '0px 25px 60px rgba(0, 0, 0, 0.32)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// Apply responsive font sizes
const theme = responsiveFontSizes(baseTheme);

export default theme; 