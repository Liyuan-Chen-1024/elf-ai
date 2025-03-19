import { alpha, createTheme } from '@mui/material/styles';

// Define brand colors
const elfGreen = {
  light: '#5AE9B3',
  main: '#00CEAC',
  dark: '#00A792',
  contrastText: '#FFFFFF',
};

const elfPurple = {
  light: '#9C8AFF',
  main: '#7B68EE',
  dark: '#6A5ACD',
  contrastText: '#FFFFFF',
};

const elfBlue = {
  light: '#8CDFFF',
  main: '#59C1FF',
  dark: '#2F9DF1',
  contrastText: '#FFFFFF',
};

const elfRed = {
  light: '#FF7B8F',
  main: '#FF5A79',
  dark: '#E53E65',
  contrastText: '#FFFFFF',
};

const elfAmber = {
  light: '#FFD485',
  main: '#FFB945',
  dark: '#FF9800',
  contrastText: '#FFFFFF',
};

// Custom shadows
const createCustomShadows = (mode: 'light' | 'dark') => ({
  primary: `0 8px 24px 0 ${alpha(elfGreen.main, mode === 'dark' ? 0.25 : 0.12)}`,
  secondary: `0 8px 24px 0 ${alpha(elfPurple.main, mode === 'dark' ? 0.25 : 0.12)}`,
  info: `0 8px 24px 0 ${alpha(elfBlue.main, mode === 'dark' ? 0.25 : 0.12)}`,
  success: `0 8px 24px 0 ${alpha(elfGreen.main, mode === 'dark' ? 0.25 : 0.12)}`,
  warning: `0 8px 24px 0 ${alpha(elfAmber.main, mode === 'dark' ? 0.25 : 0.12)}`,
  error: `0 8px 24px 0 ${alpha(elfRed.main, mode === 'dark' ? 0.25 : 0.12)}`,
});

// Create theme factory function
export const createAppTheme = (mode: 'light' | 'dark') => {
  // Background gradients - made more playful
  const backgroundGradients = {
    light: {
      default: 'linear-gradient(145deg, #F8FAFC 0%, #EFF6FF 100%)',
      paper: '#FFFFFF',
      dialogGradient: 'radial-gradient(circle at top right, rgba(90, 233, 179, 0.08), rgba(41, 198, 149, 0.03))',
      subtle: 'linear-gradient(120deg, rgba(90, 233, 179, 0.03) 0%, rgba(123, 104, 238, 0.03) 100%)',
    },
    dark: {
      default: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)',
      paper: '#1E293B',
      dialogGradient: 'radial-gradient(circle at top right, rgba(90, 233, 179, 0.08), rgba(41, 198, 149, 0.03))',
      subtle: 'linear-gradient(120deg, rgba(90, 233, 179, 0.05) 0%, rgba(123, 104, 238, 0.05) 100%)',
    },
  };

  const customShadows = createCustomShadows(mode);

  return createTheme({
    palette: {
      mode,
      primary: elfGreen,
      secondary: elfPurple,
      info: elfBlue,
      success: elfGreen,
      warning: elfAmber,
      error: elfRed,
      background: {
        default: mode === 'light' ? '#F8FAFC' : '#0F172A',
        paper: mode === 'light' ? '#FFFFFF' : '#1E293B',
      },
      grey: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
      },
      text: {
        primary: mode === 'light' ? '#1E293B' : '#F1F5F9',
        secondary: mode === 'light' ? '#64748B' : '#94A3B8',
        disabled: mode === 'light' ? '#94A3B8' : '#475569',
      },
      divider: mode === 'light' ? '#E2E8F0' : '#334155',
      action: {
        active: mode === 'light' ? '#64748B' : '#94A3B8',
        hover: mode === 'light' ? alpha('#00CEAC', 0.04) : alpha('#00CEAC', 0.12),
        selected: mode === 'light' ? alpha('#00CEAC', 0.08) : alpha('#00CEAC', 0.16),
        disabled: mode === 'light' ? alpha('#94A3B8', 0.3) : alpha('#475569', 0.3),
        disabledBackground: mode === 'light' ? alpha('#94A3B8', 0.12) : alpha('#475569', 0.12),
        focus: mode === 'light' ? alpha('#00CEAC', 0.12) : alpha('#00CEAC', 0.2),
      },
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 700,
        fontSize: '1.75rem',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontWeight: 700,
        fontSize: '1.5rem',
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 1.4,
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: 1.5,
        letterSpacing: '0.005em',
      },
      subtitle2: {
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.5,
        letterSpacing: '0.005em',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
        letterSpacing: '0.005em',
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        letterSpacing: '0.005em',
      },
      button: {
        fontWeight: 600,
        fontSize: '0.875rem',
        lineHeight: 1.5,
        letterSpacing: '0.01em',
        textTransform: 'none',
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.5,
        letterSpacing: '0.01em',
      },
      overline: {
        fontWeight: 600,
        fontSize: '0.75rem',
        lineHeight: 1.5,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: [
      'none',
      '0px 2px 4px 0px rgba(15, 23, 42, 0.05)',
      '0px 3px 6px 0px rgba(15, 23, 42, 0.08)',
      '0px 4px 8px 0px rgba(15, 23, 42, 0.1)',
      '0px 5px 12px 0px rgba(15, 23, 42, 0.12)',
      '0px 6px 14px 0px rgba(15, 23, 42, 0.13)',
      '0px 7px 16px 0px rgba(15, 23, 42, 0.14)',
      '0px 8px 18px 0px rgba(15, 23, 42, 0.15)',
      '0px 9px 20px 0px rgba(15, 23, 42, 0.16)',
      '0px 10px 22px 0px rgba(15, 23, 42, 0.17)',
      '0px 11px 24px 0px rgba(15, 23, 42, 0.18)',
      '0px 12px 26px 0px rgba(15, 23, 42, 0.19)',
      '0px 13px 28px 0px rgba(15, 23, 42, 0.2)',
      '0px 14px 30px 0px rgba(15, 23, 42, 0.21)',
      '0px 15px 32px 0px rgba(15, 23, 42, 0.22)',
      '0px 16px 34px 0px rgba(15, 23, 42, 0.23)',
      '0px 17px 36px 0px rgba(15, 23, 42, 0.24)',
      '0px 18px 38px 0px rgba(15, 23, 42, 0.25)',
      '0px 19px 40px 0px rgba(15, 23, 42, 0.26)',
      '0px 20px 42px 0px rgba(15, 23, 42, 0.27)',
      '0px 21px 44px 0px rgba(15, 23, 42, 0.28)',
      '0px 22px 46px 0px rgba(15, 23, 42, 0.29)',
      '0px 23px 48px 0px rgba(15, 23, 42, 0.3)',
      '0px 24px 50px 0px rgba(15, 23, 42, 0.31)',
      '0px 25px 52px 0px rgba(15, 23, 42, 0.32)',
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: mode === 'light' 
              ? backgroundGradients.light.default 
              : backgroundGradients.dark.default,
            backgroundAttachment: 'fixed',
            '&::-webkit-scrollbar': {
              width: '10px',
              height: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: mode === 'light' ? '#CBD5E1' : '#475569',
              borderRadius: '8px',
              border: `3px solid ${mode === 'light' ? '#F1F5F9' : '#1E293B'}`,
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '@media (min-width:0px)': {
              WebkitTapHighlightColor: 'transparent',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '8px 16px',
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 600,
            transition: 'all 0.2s ease-in-out',
            position: 'relative',
            overflow: 'hidden',
            ':after': {
              content: '""',
              position: 'absolute',
              bottom: '-8px',
              left: '-8px',
              height: '16px',
              width: '16px',
              borderRadius: '50%',
              transition: 'transform 0.3s ease-out',
              transform: 'scale(0)',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
            },
            ':hover': {
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              ':after': {
                transform: 'scale(18)',
              },
            },
            ':active': {
              transform: 'scale(0.98)',
            },
          },
          contained: {
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: mode === 'light' 
              ? backgroundGradients.light.subtle
              : backgroundGradients.dark.subtle,
            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
            ':hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
          },
          elevation2: {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: mode === 'light' 
              ? 'rgba(255, 255, 255, 0.8)'
              : 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backdropFilter: 'blur(8px)',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'transform 0.2s ease-in-out',
            ':hover': {
              transform: 'scale(1.05)',
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            transition: 'box-shadow 0.2s ease',
            '&:hover:not(.Mui-disabled)': {
              boxShadow: `0 0 0 1px ${mode === 'light' ? alpha(elfGreen.main, 0.2) : alpha(elfGreen.main, 0.2)}`,
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 2px ${mode === 'light' ? alpha(elfGreen.main, 0.3) : alpha(elfGreen.main, 0.4)}`,
            },
          },
        },
      },
    },
  });
};

// Create light theme
const lightTheme = createAppTheme('light');

export default lightTheme;
