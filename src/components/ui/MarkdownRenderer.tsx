import React from 'react';
import ReactMarkdown from '@uiw/react-markdown-preview';
import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import '@uiw/react-markdown-preview/markdown.css';

const MarkdownContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  '& .wmde-markdown': {
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '16px !important',
    lineHeight: '1.6',
  },
  '& .wmde-markdown pre': {
    backgroundColor: 'rgba(15, 31, 40, 0.98)',
    border: '1px solid rgba(255, 184, 0, 0.2)',
    borderRadius: '4px',
  },
  '& .wmde-markdown code': {
    color: 'rgba(255, 184, 0, 0.9)',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
  },
  '& .wmde-markdown h1': {
    color: 'rgba(255, 184, 0, 0.9)',
    borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
  },
  '& .wmde-markdown h2': {
    color: 'rgba(255, 184, 0, 0.9)',
    borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
  },
  '& .wmde-markdown h3': {
    color: 'rgba(255, 184, 0, 0.9)',
    borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
  },
  '& .wmde-markdown h4': {
    color: 'rgba(255, 184, 0, 0.9)',
    borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
  },
  '& .wmde-markdown h5': {
    color: 'rgba(255, 184, 0, 0.9)',
    borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
  },
  '& .wmde-markdown h6': {
    color: 'rgba(255, 184, 0, 0.9)',
    borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
  },
  '& .wmde-markdown a': {
    color: 'rgba(255, 184, 0, 0.9)',
    '&:hover': {
      color: 'rgba(255, 184, 0, 1)',
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
  return (
    <MarkdownContainer className={className}>
      <ReactMarkdown
        source={content}
        wrapperElement={{
          'data-color-mode': 'dark'
        }}
      />
    </MarkdownContainer>
  );
};

export default MarkdownRenderer;

