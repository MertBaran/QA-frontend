import React, { useState, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { Box, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const EditorContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  '& .w-md-editor': {
    backgroundColor: `${theme.palette.background.paper} !important`,
    border: `1px solid ${theme.palette.divider} !important`,
    borderRadius: '8px',
    overflow: 'hidden',
    fontSize: '16px !important',
  },
  '& .w-md-editor-toolbar': {
    backgroundColor: `${theme.palette.mode === 'dark' 
      ? theme.palette.background.default 
      : theme.palette.grey[100]} !important`,
    borderBottom: `1px solid ${theme.palette.divider} !important`,
    padding: theme.spacing(1),
  },
  '& .w-md-editor-toolbar button': {
    color: `${theme.palette.text.secondary} !important`,
    backgroundColor: 'transparent !important',
    border: 'none !important',
    borderRadius: '4px',
    padding: theme.spacing(0.75, 1.5),
    fontSize: '16px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      color: `${theme.palette.primary.main} !important`,
      backgroundColor: `${theme.palette.mode === 'dark'
        ? `${theme.palette.primary.main}22`
        : `${theme.palette.primary.main}11`} !important`,
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
    color: `${theme.palette.text.primary} !important`,
    backgroundColor: 'transparent !important',
    lineHeight: '1.6',
  },
  '& .w-md-editor-textarea': {
    color: `${theme.palette.text.primary} !important`,
    backgroundColor: 'transparent !important',
  },
  '& .w-md-editor-preview': {
    backgroundColor: `${theme.palette.background.paper} !important`,
    color: `${theme.palette.text.primary} !important`,
  },
  '& .wmde-markdown': {
    backgroundColor: 'transparent !important',
    color: `${theme.palette.text.primary} !important`,
    fontSize: '16px !important',
    lineHeight: '1.6',
  },
  '& .wmde-markdown p': {
    fontSize: '16px !important',
    color: `${theme.palette.text.primary} !important`,
  },
  '& .wmde-markdown pre': {
    backgroundColor: `${theme.palette.mode === 'dark' 
      ? theme.palette.background.default 
      : theme.palette.grey[100]} !important`,
    border: `1px solid ${theme.palette.divider} !important`,
    borderRadius: '4px',
  },
  '& .wmde-markdown code': {
    color: `${theme.palette.primary.main} !important`,
    backgroundColor: `${theme.palette.mode === 'dark'
      ? `${theme.palette.primary.main}22`
      : `${theme.palette.primary.main}11`} !important`,
  },
  '& .wmde-markdown h1': {
    color: `${theme.palette.primary.main} !important`,
    borderBottom: `1px solid ${theme.palette.divider} !important`,
  },
  '& .wmde-markdown h2': {
    color: `${theme.palette.primary.main} !important`,
    borderBottom: `1px solid ${theme.palette.divider} !important`,
  },
  '& .wmde-markdown h3': {
    color: `${theme.palette.primary.main} !important`,
    borderBottom: `1px solid ${theme.palette.divider} !important`,
  },
  '& .wmde-markdown h4': {
    color: `${theme.palette.primary.main} !important`,
    borderBottom: `1px solid ${theme.palette.divider} !important`,
  },
  '& .wmde-markdown h5': {
    color: `${theme.palette.primary.main} !important`,
    borderBottom: `1px solid ${theme.palette.divider} !important`,
  },
  '& .wmde-markdown h6': {
    color: `${theme.palette.primary.main} !important`,
    borderBottom: `1px solid ${theme.palette.divider} !important`,
  },
  '& .wmde-markdown a': {
    color: `${theme.palette.primary.main} !important`,
    '&:hover': {
      color: `${theme.palette.primary.dark} !important`,
    },
  },
  '& .wmde-markdown blockquote': {
    borderLeft: `4px solid ${theme.palette.primary.main}80 !important`,
    color: `${theme.palette.text.secondary} !important`,
  },
  '& .wmde-markdown table': {
    border: `1px solid ${theme.palette.divider} !important`,
  },
  '& .wmde-markdown th': {
    border: `1px solid ${theme.palette.divider} !important`,
  },
  '& .wmde-markdown td': {
    border: `1px solid ${theme.palette.divider} !important`,
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
  const theme = useTheme();
  const [data, setData] = useState(value);
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Update internal state when value prop changes
  React.useEffect(() => {
    setData(value);
  }, [value]);

  // Force update MDEditor styles when theme changes
  React.useEffect(() => {
    if (editorRef.current) {
      const editor = editorRef.current.querySelector('.w-md-editor');
      if (editor) {
        const editorElement = editor as HTMLElement;
        editorElement.style.backgroundColor = theme.palette.background.paper;
        editorElement.style.borderColor = theme.palette.divider;
        
        const toolbar = editorElement.querySelector('.w-md-editor-toolbar');
        if (toolbar) {
          (toolbar as HTMLElement).style.backgroundColor = theme.palette.mode === 'dark' 
            ? theme.palette.background.default 
            : theme.palette.grey[100];
          (toolbar as HTMLElement).style.borderBottomColor = theme.palette.divider;
        }
        
        const textArea = editorElement.querySelector('.w-md-editor-text-pre');
        if (textArea) {
          (textArea as HTMLElement).style.color = theme.palette.text.primary;
        }
      }
    }
  }, [theme]);

  const handleChange = useCallback(
    (val?: string) => {
      setData(val || '');
      onChange(val);
    },
    [onChange]
  );

  return (
    <Box ref={editorRef}>
      <EditorContainer key={`editor-${theme.palette.mode}-${theme.palette.primary.main}`}>
        <MDEditor
          value={data}
          onChange={handleChange}
          preview="edit"
          hideToolbar={false}
          visibleDragbar={true}
          data-color-mode={theme.palette.mode}
          height={minHeight}
          previewOptions={{
            rehypePlugins: [],
          }}
        />
      </EditorContainer>
      {error && helperText && (
        <Typography
          variant="caption"
          sx={(theme) => ({
            color: theme.palette.error.main,
            mt: 0.5,
            display: 'block',
          })}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default RichTextEditor;
