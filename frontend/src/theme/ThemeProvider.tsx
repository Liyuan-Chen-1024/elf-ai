import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { create } from 'zustand';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: false,
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));

export const ThemeProvider = ({ children }: { children: any }) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
        },
      }),
    [isDarkMode]
  );

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
};
