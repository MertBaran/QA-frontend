import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { Box, Typography, useTheme, Theme } from '@mui/material';
import { styled, SxProps } from '@mui/material/styles';
import MarkdownIt from 'markdown-it';

// Type for MdEditor ref (react-markdown-editor-lite doesn't export this type properly)
// Using any for now as the library doesn't provide proper TypeScript types
type MdEditorRef = any;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PLACEHOLDER = 'İçeriğinizi buraya yazın...';
const DEFAULT_MIN_HEIGHT = 200;
const OPACITY_PLACEHOLDER = 0.6;
const OPACITY_HOVER_BORDER = 0.5; // 80 in hex = ~0.5
const OPACITY_FOCUS_SHADOW = 0.125; // 20 in hex = ~0.125
const OPACITY_TOOLBAR_HOVER_DARK = 0.133; // 22 in hex = ~0.133
const OPACITY_TOOLBAR_HOVER_LIGHT = 0.067; // 11 in hex = ~0.067
const OPACITY_TOOLBAR_ACTIVE_DARK = 0.2; // 33 in hex = ~0.2
const OPACITY_TOOLBAR_ACTIVE_LIGHT = 0.133; // 22 in hex = ~0.133

const EDITOR_VIEW_CONFIG = {
  menu: true,
  md: true,
  html: false,
} as const;

const EDITOR_CAN_VIEW_CONFIG = {
  menu: true,
  md: true,
  html: false,
  both: false,
  fullScreen: false,
  hideMenu: false,
} as const;

// ============================================================================
// Markdown Parser Configuration
// ============================================================================

const createMarkdownParser = (): MarkdownIt => {
  return new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });
};

// Singleton instance for performance
const markdownParser = createMarkdownParser();

// ============================================================================
// Types
// ============================================================================

export const CONTENT_MAX_LENGTH = 8000;
const DEFAULT_MAX_LENGTH = CONTENT_MAX_LENGTH;

export interface RichTextEditorProps {
  /** The markdown content value */
  value: string;
  /** Callback fired when the value changes */
  onChange: (value: string | undefined) => void;
  /** Placeholder text displayed when editor is empty */
  placeholder?: string;
  /** Minimum height of the editor in pixels */
  minHeight?: number;
  /** Maximum character limit (enforced, no overflow allowed). Default 3000 */
  maxLength?: number;
  /** If true, the editor is disabled */
  disabled?: boolean;
  /** If true, displays error state */
  error?: boolean;
  /** Helper text displayed below the editor (typically for errors) */
  helperText?: string;
  /** Custom styles applied to the editor container */
  sx?: SxProps<Theme>;
  /** Custom markdown parser configuration */
  markdownParser?: MarkdownIt;
}

interface EditorState {
  internalValue: string;
  isInitialized: boolean;
}

// ============================================================================
// Styled Components
// ============================================================================

const EditorContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'hasError',
})<{ hasError?: boolean }>(({ theme, hasError }) => {
  const getBorderColor = (state: 'default' | 'hover' | 'focus') => {
    if (hasError) {
      return theme.palette.error.main;
    }
    const baseColor = theme.palette.primary.main;
    switch (state) {
      case 'hover':
        return `${baseColor}${Math.round(OPACITY_HOVER_BORDER * 255).toString(16).padStart(2, '0')}`;
      case 'focus':
        return baseColor;
      default:
        return theme.palette.divider;
    }
  };

  const getShadowColor = () => {
    if (hasError) {
      return `${theme.palette.error.main}${Math.round(OPACITY_FOCUS_SHADOW * 255).toString(16).padStart(2, '0')}`;
    }
    return `${theme.palette.primary.main}${Math.round(OPACITY_FOCUS_SHADOW * 255).toString(16).padStart(2, '0')}`;
  };

  const getToolbarBackground = () => {
    return theme.palette.mode === 'dark'
      ? theme.palette.background.default
      : theme.palette.grey[100];
  };

  const getToolbarHoverBackground = () => {
    const baseColor = theme.palette.primary.main;
    const opacity = theme.palette.mode === 'dark'
      ? OPACITY_TOOLBAR_HOVER_DARK
      : OPACITY_TOOLBAR_HOVER_LIGHT;
    return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  const getToolbarActiveBackground = () => {
    const baseColor = theme.palette.primary.main;
    const opacity = theme.palette.mode === 'dark'
      ? OPACITY_TOOLBAR_ACTIVE_DARK
      : OPACITY_TOOLBAR_ACTIVE_LIGHT;
    return `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  };

  return {
    width: '100%',
    '& .rc-md-editor': {
      backgroundColor: `${theme.palette.background.paper} !important`,
      border: `1px solid ${getBorderColor('default')} !important`,
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        borderColor: `${getBorderColor('hover')} !important`,
      },
      '&:focus-within': {
        borderColor: `${getBorderColor('focus')} !important`,
        boxShadow: `0 0 0 2px ${getShadowColor()} !important`,
      },
    },
    '& .rc-md-editor .editor-container .section-container': {
      backgroundColor: `${theme.palette.background.paper} !important`,
    },
    '& .rc-md-editor .editor-container .section-container .section': {
      backgroundColor: `${theme.palette.background.paper} !important`,
      color: `${theme.palette.text.primary} !important`,
      borderRight: `1px solid ${theme.palette.divider} !important`,
      '&:last-child': {
        borderRight: 'none !important',
      },
    },
    '& .rc-md-editor .editor-container .section-container .section .input, & .rc-md-editor .editor-container .sec-md .input': {
      backgroundColor: `${theme.palette.background.paper} !important`,
      color: `${theme.palette.text.primary} !important`,
      fontSize: '16px !important',
      lineHeight: '1.6 !important',
      fontFamily: 'inherit !important',
      padding: '10px 15px !important',
      '&::placeholder': {
        color: `${theme.palette.text.secondary} !important`,
        opacity: OPACITY_PLACEHOLDER,
      },
    },
    '& .rc-md-editor .editor-container .section-container .section .html-wrap, & .rc-md-editor .editor-container .sec-html .html-wrap': {
      backgroundColor: `${theme.palette.background.paper} !important`,
      color: `${theme.palette.text.primary} !important`,
      fontSize: '16px !important',
      lineHeight: '1.6 !important',
      fontFamily: 'inherit !important',
      padding: '10px 15px !important',
    },
    '& .rc-md-editor .toolbar': {
      backgroundColor: `${getToolbarBackground()} !important`,
      borderBottom: `1px solid ${theme.palette.divider} !important`,
      padding: '8px 4px !important',
    },
    '& .rc-md-editor .toolbar .toolbar-item': {
      color: `${theme.palette.text.secondary} !important`,
      borderRadius: '4px !important',
      padding: '4px 8px !important',
      margin: '0 2px !important',
      transition: 'all 0.2s ease !important',
      '&:hover': {
        color: `${theme.palette.primary.main} !important`,
        backgroundColor: `${getToolbarHoverBackground()} !important`,
      },
      '&.active': {
        color: `${theme.palette.primary.main} !important`,
        backgroundColor: `${getToolbarActiveBackground()} !important`,
      },
    },
    '& .rc-md-editor .toolbar .toolbar-item svg': {
      fill: 'currentColor !important',
    },
    '& .rc-md-editor .editor-container': {
      borderTop: 'none !important',
    },
  };
});

const ErrorText = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  marginTop: theme.spacing(0.5),
  display: 'block',
}));

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Manages internal editor state with controlled reset behavior
 */
const useEditorState = (externalValue: string): [string, (value: string) => void] => {
  const [state, setState] = React.useState<EditorState>({
    internalValue: externalValue,
    isInitialized: false,
  });

  // Initialize on mount
  useEffect(() => {
    if (!state.isInitialized) {
      setState({
        internalValue: externalValue,
        isInitialized: true,
      });
    }
  }, [externalValue, state.isInitialized]);

  // Reset when external value becomes empty
  useEffect(() => {
    if (
      state.isInitialized &&
      externalValue === '' &&
      state.internalValue !== ''
    ) {
      setState((prev) => ({
        ...prev,
        internalValue: '',
      }));
    }
  }, [externalValue, state.internalValue, state.isInitialized]);

  const updateValue = useCallback((newValue: string) => {
    setState((prev) => ({
      ...prev,
      internalValue: newValue,
    }));
  }, []);

  return [state.internalValue, updateValue];
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * A rich text editor component with markdown support.
 * Built on top of react-markdown-editor-lite with Material-UI theming.
 *
 * @example
 * ```tsx
 * <RichTextEditor
 *   value={content}
 *   onChange={(value) => setContent(value || '')}
 *   placeholder="Enter your content..."
 *   minHeight={300}
 *   error={hasError}
 *   helperText={errorMessage}
 * />
 * ```
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = DEFAULT_PLACEHOLDER,
  minHeight = DEFAULT_MIN_HEIGHT,
  maxLength = DEFAULT_MAX_LENGTH,
  disabled = false,
  error = false,
  helperText,
  sx,
  markdownParser: customParser,
}) => {
  const theme = useTheme();
  const editorRef = useRef<MdEditorRef>(null);
  const [internalValue, setInternalValue] = useEditorState(value);
  const parser = useMemo(() => customParser || markdownParser, [customParser]);

  // Reset editor instance when value is cleared externally
  useEffect(() => {
    if (
      value === '' &&
      internalValue === '' &&
      editorRef.current &&
      typeof editorRef.current.setValue === 'function'
    ) {
      try {
        editorRef.current.setValue('');
      } catch (err) {
        // Silently handle errors if editor is not ready
        console.warn('Failed to reset editor:', err);
      }
    }
  }, [value, internalValue]);

  const handleChange = useCallback(
    ({ text }: { text: string; html: string }) => {
      const truncated = text.length > maxLength ? text.slice(0, maxLength) : text;
      setInternalValue(truncated);
      onChange(truncated);
    },
    [onChange, setInternalValue, maxLength]
  );

  const renderHTML = useCallback(
    (text: string) => parser.render(text),
    [parser]
  );

  return (
    <Box>
      <EditorContainer hasError={error} sx={sx}>
        <MdEditor
          ref={editorRef}
          value={internalValue}
          style={{ height: `${minHeight}px` }}
          renderHTML={renderHTML}
          onChange={handleChange}
          placeholder={placeholder}
          view={EDITOR_VIEW_CONFIG}
          canView={EDITOR_CAN_VIEW_CONFIG}
        />
      </EditorContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, minHeight: 20 }}>
        {error && helperText ? (
          <ErrorText variant="caption">{helperText}</ErrorText>
        ) : (
          <span />
        )}
        <Typography
          variant="caption"
          sx={{
            color: internalValue.length >= maxLength
              ? theme.palette.error.main
              : theme.palette.text.secondary,
            ml: 'auto',
          }}
        >
          {internalValue.length} / {maxLength}
        </Typography>
      </Box>
    </Box>
  );
};

// ============================================================================
// Memoization
// ============================================================================

/**
 * Custom comparison function for React.memo
 * Only re-renders when relevant props change
 */
const arePropsEqual = (
  prevProps: RichTextEditorProps,
  nextProps: RichTextEditorProps
): boolean => {
  // Always re-render on value reset
  if (prevProps.value !== nextProps.value && nextProps.value === '') {
    return false;
  }

  // Compare all relevant props
  return (
    prevProps.value === nextProps.value &&
    prevProps.error === nextProps.error &&
    prevProps.helperText === nextProps.helperText &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.minHeight === nextProps.minHeight &&
    prevProps.maxLength === nextProps.maxLength &&
    prevProps.placeholder === nextProps.placeholder
  );
};

export default React.memo(RichTextEditor, arePropsEqual);
