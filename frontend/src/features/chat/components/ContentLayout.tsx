import React from 'react';
import { Box, BoxProps } from '@mui/material';
import { THEME } from '../styles/theme';

interface ContentLayoutProps extends Omit<BoxProps, 'sx'> {
  fullHeight?: boolean;
  centered?: boolean;
  sx?: BoxProps['sx'];
}

/**
 * ContentLayout provides consistent layout styling for content areas.
 * It can be configured for full-height, centered content, or regular flow.
 */
const ContentLayout: React.FC<ContentLayoutProps> = ({
  children,
  fullHeight = false,
  centered = false,
  sx = {},
  ...props
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        ...(fullHeight && {
          height: THEME.layout.contentHeight,
          maxHeight: THEME.layout.contentHeight,
        }),
        ...(centered && {
          justifyContent: 'center',
          alignItems: 'center',
        }),
        backgroundColor: THEME.colors.background.surface,
        ...sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default ContentLayout; 