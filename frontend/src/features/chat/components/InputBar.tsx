import React from 'react';
import { Box } from '@mui/material';
import { THEME } from '../styles/theme';

interface InputBarProps {
  children: React.ReactNode;
}

/**
 * InputBar provides consistent styling for the sticky input bar
 * at the bottom of conversation views.
 */
const InputBar: React.FC<InputBarProps> = ({ children }) => {
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 10,
        width: '100%',
        background: THEME.colors.background.surface,
        borderTop: `1px solid ${THEME.colors.background.inputBorder}`,
        py: 2,
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '90%',
          maxWidth: THEME.layout.maxContentWidth,
          minWidth: '300px',
          '& textarea': {
            maxHeight: THEME.layout.inputMaxHeight,
            minHeight: THEME.layout.inputMinHeight,
            height: THEME.layout.inputMinHeight,
            overflow: 'auto',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default InputBar;
