import { Box } from '@mui/material';
import React from 'react';

interface MarkdownPreviewProps {
  source: string;
  style?: React.CSSProperties;
}

// Simple component that renders text with basic formatting
const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ source, style }) => {
  // Format code blocks
  const formatText = (text: string) => {
    if (!text) return '';

    // Convert markdown-style code blocks to basic rendering
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const formattedText = text.replace(codeBlockRegex, (match, code) => {
      return `<pre>${code.trim()}</pre>`;
    });

    // Convert markdown-style inline code
    const inlineCodeRegex = /`([^`]+)`/g;
    return formattedText.replace(inlineCodeRegex, (match, code) => {
      return `<code>${code}</code>`;
    });
  };

  // Format text with simple paragraph breaks
  const getParagraphs = (text: string) => {
    if (!text) return '';

    // Split text by double newlines (paragraphs)
    return text
      .split(/\n\n+/)
      .map((paragraph, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: formatText(paragraph) }} />
      ));
  };

  return (
    <Box
      sx={{
        '& p': {
          margin: '0.5em 0',
          lineHeight: 1.6,
          '&:first-of-type': { marginTop: 0 },
          '&:last-of-type': { marginBottom: 0 },
        },
        '& code': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          padding: '0.2em 0.4em',
          borderRadius: '3px',
          fontFamily: 'monospace',
          fontSize: '0.85em',
        },
        '& pre': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
          padding: '0.5em',
          borderRadius: '4px',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          fontSize: '0.85em',
        },
        '& a': {
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
        '& ul, & ol': {
          paddingLeft: '1.5em',
          margin: '0.5em 0',
        },
        '& blockquote': {
          borderLeft: '3px solid rgba(0, 0, 0, 0.1)',
          paddingLeft: '1em',
          margin: '0.5em 0',
          color: 'text.secondary',
        },
        ...style,
      }}
    >
      {typeof source === 'string' ? (
        source.includes('\n') ? (
          getParagraphs(source)
        ) : (
          <p dangerouslySetInnerHTML={{ __html: formatText(source) }} />
        )
      ) : (
        <p>{String(source)}</p>
      )}
    </Box>
  );
};

export default MarkdownPreview;
