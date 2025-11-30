import React from 'react';
import { Components } from 'react-markdown';

/**
 * Custom renderers for Markdown components
 */
export const MarkdownComponents: Partial<Components> = {
  // Override code block rendering
  code(props) {
    const { children, className } = props;
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    // Special handling for single-line code blocks
    const isSimpleCodeBlock =
      typeof children === 'string' && !children.includes('\n') && children.trim().length < 30;

    // Detect if this is an inline code or a block code
    const isInline = !className?.includes('language-');

    if (!isInline) {
      // Regular code blocks - add a special class for targeting via CSS
      return (
        <pre className={`code-block-root ${isSimpleCodeBlock ? 'simple-code-block' : ''}`}>
          {/* Code language indicator */}
          {language && <div className="code-language-indicator">{language.toUpperCase()}</div>}
          <code className={className || ''}>{children}</code>
        </pre>
      );
    }

    // Inline code handling
    return <code className="inline-code">{children}</code>;
  },

  // Override table rendering for better control
  table(props) {
    return (
      <div
        style={{
          overflowX: 'auto',
          maxWidth: '100%',
          margin: '1.5em 0',
          padding: '1em',
          background: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <table
          {...props}
          style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '3px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            background: 'white',
            border: '2px solid #aaa',
            borderRadius: '6px',
            overflow: 'hidden',
          }}
        />
      </div>
    );
  },

  // Custom cell rendering
  td(props) {
    return (
      <td
        {...props}
        style={{
          border: '2px solid #aaa',
          padding: '1em',
          textAlign: 'center',
          verticalAlign: 'middle',
          fontSize: '1.5em',
          fontWeight: 700,
          color: 'black',
          backgroundColor: 'white',
          minWidth: '60px',
          minHeight: '60px',
        }}
      />
    );
  },

  // Custom header cell rendering
  th(props) {
    return (
      <th
        {...props}
        style={{
          border: '2px solid #aaa',
          padding: '1em',
          textAlign: 'center',
          verticalAlign: 'middle',
          fontSize: '1.5em',
          fontWeight: 700,
          color: 'black',
          backgroundColor: '#f0f0f0',
          minWidth: '60px',
          minHeight: '60px',
        }}
      />
    );
  },

  // Custom row rendering
  tr(props) {
    return (
      <tr
        {...props}
        style={{
          backgroundColor: 'white',
        }}
      />
    );
  },

  // Custom list item rendering
  li(props) {
    const { children, ...rest } = props;

    // Simple check for "Explanation:" text in list items
    const containsExplanationText =
      typeof children === 'string' && children.includes('Explanation:');

    return (
      <li
        {...rest}
        className={containsExplanationText ? 'explanation-list-item' : undefined}
        style={{
          marginBottom: '0.75rem',
        }}
      >
        {children}
      </li>
    );
  },

  // Custom heading for explanations
  h3(props) {
    const { children, ...rest } = props;

    // Check if this is an explanation heading
    const isExplanationHeading =
      typeof children === 'string' && (children === 'Explanation:' || children === 'Explanation');

    if (isExplanationHeading) {
      return (
        <h3
          {...rest}
          className="explanation-heading"
          style={{
            color: '#555',
            fontWeight: 600,
            fontSize: '1.1rem',
            marginTop: '1.5rem',
            marginBottom: '0.75rem',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid #e0e0e0',
          }}
        >
          {children}
        </h3>
      );
    }

    return <h3 {...rest}>{children}</h3>;
  },
};

