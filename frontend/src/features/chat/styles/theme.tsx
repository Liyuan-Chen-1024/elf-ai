import { createTheme } from '@mui/material/styles';

// Define base colors
const accentPurple = {
  light: '#eddffc',
  main: '#9f56f3',
  dark: '#7c34d9',
  border: '#9f56f3'
};

// Define theme colors
export const THEME = {
  colors: {
    primary: {
      main: '#7f56da',
      light: '#e9dffc',
    },
    text: {
      primary: '#1c1c1e',
      secondary: 'rgba(28, 28, 30, 0.65)',
      muted: 'rgba(28, 28, 30, 0.45)',
      white: '#ffffff',
      black: '#000000',
    },
    background: {
      default: '#f6f6f6',
      paper: '#ffffff',
      input: '#f6f6f6',
      inputBorder: '#e2e2e2',
      inputFocusBorder: '#bebebe',
      assistant: '#f2f4f8',
      user: '#f2f0fe',
    },
    accent: {
      purple: accentPurple,
    },
  },
  typography: {
    fontSize: {
      tiny: '0.6875rem',
      small: '0.8125rem',
      regular: '0.9375rem',
      large: '1.0625rem'
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
    spacing: {
      tight: '0.01em',
      normal: 'normal',
    }
  },
  animations: {
    pulse: '@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }',
    float: '@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-2px); } 100% { transform: translateY(0px); } }',
    blink: '@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }',
  },
  avatars: {
    user: '',
    assistant: 'https://storage.googleapis.com/elf-ai-media/static/avatar.svg',
  },
  // Custom syntax highlighting colors
  syntax: {
    background: '#282c34', // One Dark background
    text: '#abb2bf',       // Default text color
    comment: '#7f848e',    // Comments
    keyword: '#c678dd',    // Keywords like def, if, import
    string: '#98c379',     // String literals
    number: '#d19a66',     // Number literals
    function: '#61afef',   // Function names
    operator: '#56b6c2',   // Operators
    variable: '#e06c75',   // Variables
    property: '#e5c07b',   // Properties
    className: '#e5c07b',  // Class names
    builtin: '#56b6c2',    // Builtin functions like print
    punctuation: '#7f848e' // Punctuation
  }
};

export default createTheme({
  palette: {
    primary: {
      main: THEME.colors.primary.main,
    },
    text: {
      primary: THEME.colors.text.primary,
    },
    background: {
      default: THEME.colors.background.default,
      paper: THEME.colors.background.paper,
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
}); 