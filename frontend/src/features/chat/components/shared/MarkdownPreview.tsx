import React from 'react';
import { Box, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownPreviewProps {
  content: string;
  highlightMatches?: (text: string) => any;
  children?: any;
  isStreaming?: boolean;
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: string | string[];
}

export const MarkdownPreview = ({
  content,
  highlightMatches,
  children,
  isStreaming = false,
}: MarkdownPreviewProps) => {
  const containerRef = React.createRef<HTMLDivElement>();

  if (highlightMatches) {
    return highlightMatches(content);
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        '& pre': {
          margin: 0,
          padding: 2,
          borderRadius: 1,
          overflow: 'auto',
        },
        '& code': {
          fontFamily: 'monospace',
          fontSize: '0.9em',
        },
        '& p': {
          margin: 0,
          marginBottom: 1,
          '&:last-child': {
            marginBottom: 0,
          },
        },
        opacity: isStreaming ? 0.7 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <ReactMarkdown
        components={{
          pre: ({ children, ...props }) => (
            <pre {...props} style={{ margin: 0, padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
              {children}
            </pre>
          ),
          code: ({ inline, className, children }: CodeBlockProps) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={materialDark}
                language={match[1]}
                PreTag="div"
                customStyle={{ margin: 0 }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <Typography
                component="code"
                className={className}
                sx={{ fontFamily: 'monospace' }}
              >
                {children}
              </Typography>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {children}
    </Box>
  );
}; 