import React, { useState, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const EditorContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  '& .w-md-editor': {
    backgroundColor: 'rgba(10, 26, 35, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
    fontSize: '16px !important',
  },
  '& .w-md-editor-toolbar': {
    backgroundColor: 'rgba(15, 31, 40, 0.98)',
    borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
    padding: theme.spacing(1),
  },
  '& .w-md-editor-toolbar button': {
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    padding: theme.spacing(0.75, 1.5),
    fontSize: '16px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      color: 'rgba(255, 184, 0, 0.9)',
      backgroundColor: 'rgba(255, 184, 0, 0.1)',
    },
  },
  '& .w-md-editor-text': {
    fontSize: '16px !important',
    lineHeight: '1.6 !important',
  },
  '& .w-md-editor-textarea, & .w-md-editor-text-pre': {
    fontSize: '16px !important',
  },
  '& .w-md-editor-text-pre': {
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'transparent',
    lineHeight: '1.6',
  },
  '& .w-md-editor-preview': {
    backgroundColor: 'rgba(10, 26, 35, 0.95)',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  '& .wmde-markdown': {
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '16px !important',
    lineHeight: '1.6',
  },
  '& .wmde-markdown p': {
    fontSize: '16px !important',
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
}));

interface RichTextEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'İçeriğinizi buraya yazın...',
  minHeight = 200,
  disabled = false,
  error = false,
  helperText,
}) => {
  const [data, setData] = useState(value);

  // Update internal state when value prop changes
  React.useEffect(() => {
    setData(value);
  }, [value]);

  const handleChange = useCallback(
    (val?: string) => {
      setData(val || '');
      onChange(val);
    },
    [onChange]
  );

  return (
    <Box>
      <EditorContainer>
        <MDEditor
          value={data}
          onChange={handleChange}
          preview="edit"
          hideToolbar={false}
          visibleDragbar={true}
          data-color-mode="dark"
          height={minHeight}
          previewOptions={{
            rehypePlugins: [],
          }}
        />
      </EditorContainer>
      {error && helperText && (
        <Typography
          variant="caption"
          sx={{
            color: '#f44336',
            mt: 0.5,
            display: 'block',
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default RichTextEditor;
