import React from 'react';
import ReactMarkdown from '@uiw/react-markdown-preview';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import '@uiw/react-markdown-preview/markdown.css';

const MarkdownContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: '100%',
  overflow: 'hidden',
  wordBreak: 'break-all',
  overflowWrap: 'break-word',
  '& .wmde-markdown': {
    backgroundColor: 'transparent',
    color: theme.palette.text.primary,
    fontSize: '16px !important',
    lineHeight: '1.6',
    maxWidth: '100%',
    overflow: 'hidden',
    wordBreak: 'break-all',
    overflowWrap: 'break-word',
  },
  '& .wmde-markdown pre': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.background.paper 
      : theme.palette.grey[100],
    border: `1px solid ${theme.palette.primary.main}33`,
    borderRadius: '4px',
  },
  '& .wmde-markdown code': {
    color: theme.palette.primary.main,
    backgroundColor: `${theme.palette.primary.main}22`,
  },
  '& .wmde-markdown h1': {
    color: theme.palette.primary.main,
    borderBottom: `1px solid ${theme.palette.primary.main}33`,
  },
  '& .wmde-markdown h2': {
    color: theme.palette.primary.main,
    borderBottom: `1px solid ${theme.palette.primary.main}33`,
  },
  '& .wmde-markdown h3': {
    color: theme.palette.primary.main,
    borderBottom: `1px solid ${theme.palette.primary.main}33`,
  },
  '& .wmde-markdown h4': {
    color: theme.palette.primary.main,
    borderBottom: `1px solid ${theme.palette.primary.main}33`,
  },
  '& .wmde-markdown h5': {
    color: theme.palette.primary.main,
    borderBottom: `1px solid ${theme.palette.primary.main}33`,
  },
  '& .wmde-markdown h6': {
    color: theme.palette.primary.main,
    borderBottom: `1px solid ${theme.palette.primary.main}33`,
  },
  '& .wmde-markdown a': {
    color: theme.palette.primary.main,
    '&:hover': {
        color: theme.palette.primary.dark,
    },
  },
  '& .wmde-markdown blockquote': {
    borderLeft: '4px solid rgba(255, 184, 0, 0.5)',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  '& .wmde-markdown table': {
    border: '1px solid rgba(255, 184, 0, 0.2)',
  },
  '& .wmde-markdown th': {
    border: '1px solid rgba(255, 184, 0, 0.1)',
  },
  '& .wmde-markdown td': {
    border: '1px solid rgba(255, 184, 0, 0.1)',
  },
  '& .wmde-markdown ul, & .wmde-markdown ol': {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  '& .wmde-markdown p': {
    marginBottom: theme.spacing(1.5),
    fontSize: '16px !important',
    wordBreak: 'break-all',
    overflowWrap: 'break-word',
    maxWidth: '100%',
  },
}));

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className 
}) => {
  // Sanitize content to remove potentially problematic HTML tags
  // This prevents React from trying to render invalid HTML tags as React components
  const sanitizedContent = React.useMemo(() => {
    if (!content) return '';
    
    // List of allowed HTML tags that are safe to render
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 's', 'b', 'i', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead', 
                        'tbody', 'tfoot', 'tr', 'th', 'td', 'hr', 'div', 'span', 'del', 'ins', 'sub', 'sup'];
    
    // Escape any HTML-like tags that might be confused as React components
    // This regex matches opening tags (with or without attributes) and closing tags
    let cleaned = content.replace(/<(\/?)([a-z][a-z0-9]*)(?:\s[^>]*)?>/gi, (match, slash, tagName) => {
      const lowerTagName = tagName.toLowerCase();
      
      // If it's not an allowed tag, escape it
      if (!allowedTags.includes(lowerTagName)) {
        // Escape the entire tag
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }
      
      // Return the original match for allowed tags
      return match;
    });
    
    return cleaned;
  }, [content]);

  return (
    <MarkdownContainer className={className}>
      <ReactMarkdown
        source={sanitizedContent}
        wrapperElement={{
          'data-color-mode': 'dark'
        }}
      />
    </MarkdownContainer>
  );
};

export default MarkdownRenderer;

