import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Box, useTheme } from '@mui/material';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const theme = useTheme();
  // #333 override - dark mode'da tema yanlış renk veriyorsa açık renk kullan
  const textColor = theme.palette.mode === 'dark' ? '#F5F5F5' : theme.palette.text.primary;
  const textStyle: React.CSSProperties = { color: textColor };

  if (!content) return null;

  return (
    <Box className={className} sx={{ fontSize: 16, lineHeight: 1.6, fontFamily: theme.typography.fontFamily, maxWidth: '100%', overflowWrap: 'break-word' }}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p style={{ ...textStyle, marginBottom: 12 }}>{children}</p>,
          li: ({ children }) => <li style={textStyle}>{children}</li>,
          span: ({ children }) => <span style={textStyle}>{children}</span>,
          strong: ({ children }) => <strong style={textStyle}>{children}</strong>,
          em: ({ children }) => <em style={textStyle}>{children}</em>,
          h1: ({ children }) => <h1 style={textStyle}>{children}</h1>,
          h2: ({ children }) => <h2 style={textStyle}>{children}</h2>,
          h3: ({ children }) => <h3 style={textStyle}>{children}</h3>,
          h4: ({ children }) => <h4 style={textStyle}>{children}</h4>,
          h5: ({ children }) => <h5 style={textStyle}>{children}</h5>,
          h6: ({ children }) => <h6 style={textStyle}>{children}</h6>,
          td: ({ children }) => <td style={textStyle}>{children}</td>,
          th: ({ children }) => <th style={textStyle}>{children}</th>,
          blockquote: ({ children }) => (
            <blockquote style={{ ...textStyle, color: theme.palette.mode === 'dark' ? 'rgba(245,245,245,0.9)' : theme.palette.text.secondary, marginLeft: 0, paddingLeft: 16, borderLeft: `4px solid ${theme.palette.primary.main}` }}>
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} style={{ color: theme.palette.primary.main }} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt || ''}
              style={{
                maxWidth: '100%',
                maxHeight: 480,
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
                borderRadius: 8,
                marginTop: 8,
                marginBottom: 8,
              }}
              loading="lazy"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;
