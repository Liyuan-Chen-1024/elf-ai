import React from 'react';
import { Box, Typography } from '@mui/material';
import { THEME } from '../styles/theme';

interface ExplanationSectionProps {
  title?: string;
  children: React.ReactNode;
}

/**
 * ExplanationSection component provides a styled container for explanations
 * with proper spacing and visual treatment to distinguish them from regular text.
 */
const ExplanationSection: React.FC<ExplanationSectionProps> = ({ title, children }) => {
  return (
    <Box
      sx={{
        margin: '1.5rem 0',
        padding: '1rem 1.25rem',
        backgroundColor: 'rgba(248, 249, 250, 0.7)',
        borderRadius: '8px',
        borderLeft: `4px solid ${THEME.colors.primary.main}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}
    >
      {title && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: THEME.typography.fontWeight.semibold,
            fontSize: '1.1rem',
            color: THEME.colors.text.primary,
            marginBottom: '0.75rem'
          }}
        >
          {title}
        </Typography>
      )}
      <Box
        sx={{
          '& > ol, & > ul': {
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            paddingLeft: '1.5rem',
          },
          '& li': {
            marginBottom: '0.75rem',
            '&:last-child': {
              marginBottom: 0
            }
          },
          '& pre.explanation-code': {
            marginLeft: 0,
            marginRight: 0,
          }
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ExplanationSection; 