import React, { useCallback, useRef, useEffect, useState } from 'react';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import { Box, Typography, TextField, useTheme, Theme, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { styled, SxProps } from '@mui/material/styles';
import { InsertLink, Quiz, Chat, InsertDriveFile } from '@mui/icons-material';
import type MarkdownIt from 'markdown-it';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import MarkdownRenderer from './MarkdownRenderer';
import {
  MD_EDITOR_PLUGINS_WITH_STYLES,
  registerMdEditorStylePlugins,
} from './mdEditorStylePlugins';

registerMdEditorStylePlugins();

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

/** Parent state (Redux vb.) senkronu — yazarken her tuşta değil */
const PARENT_SYNC_DEBOUNCE_MS = 200;
/** Canlı önizleme paneli — yazmayı bırakınca güncellenir */
const PREVIEW_DEBOUNCE_MS = 280;

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

const EDITOR_CONFIG = {
  // afterRender + markdown-it parse her tuşta çift onChange/CPU üretiyordu
  onChangeTrigger: 'beforeRender' as const,
};

const REF_TRIGGER = '/ref';
const REF_LEN = REF_TRIGGER.length;

/** Matches [text]/ref - user provides link text in brackets before /ref */
const REF_WITH_LINK_TEXT = /\[([^\]]*)\]\s*\/ref$/;

/** /ref seçiminde gösterim - numara - açıklama formatında */
function getRefDisplayLabel(
  ref: { type: string; content: string; description: string },
  index: number,
  lang: string = 'tr'
): string {
  const n = index + 1;
  const typeLabels: Record<string, { tr: string; en: string; de: string }> = {
    soru: { tr: 'soru', en: 'question', de: 'Frage' },
    cevap: { tr: 'cevap', en: 'answer', de: 'Antwort' },
    link: { tr: 'link', en: 'link', de: 'Link' },
    dosya: { tr: 'dosya', en: 'file', de: 'Datei' },
  };
  const typeKey = (lang === 'en' ? 'en' : lang === 'de' ? 'de' : 'tr') as 'tr' | 'en' | 'de';
  const typeLabel = typeLabels[ref.type]?.[typeKey] ?? ref.type;
  let desc: string;
  if (ref.description?.trim()) {
    desc = ref.description.trim();
  } else {
    switch (ref.type) {
      case 'link':
        desc = ref.content?.trim()?.slice(0, 60) || `ref-${n} ${typeLabel}`;
        break;
      case 'dosya':
        desc = ref.content?.split('/').pop()?.slice(0, 40) || `ref-${n} ${typeLabel}`;
        break;
      case 'soru':
      case 'cevap':
      default:
        desc = `ref-${n} ${typeLabel}`;
    }
  }
  return `${n} - ${desc}`;
}

function RefTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'link': return <InsertLink fontSize="small" />;
    case 'soru': return <Quiz fontSize="small" />;
    case 'cevap': return <Chat fontSize="small" />;
    case 'dosya': return <InsertDriveFile fontSize="small" />;
    default: return <InsertLink fontSize="small" />;
  }
}

// ============================================================================
// Types
// ============================================================================

export const CONTENT_MAX_LENGTH = 10000;
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
  /** When true, editor fills parent height (use with flex parent) */
  fillHeight?: boolean;
  /** Custom markdown parser configuration */
  markdownParser?: MarkdownIt;
  /** References list - when provided, enables ref: link syntax and hover highlight */
  references?: { type: string; content: string; description: string }[];
  /** Currently hovered reference index for highlight sync */
  hoveredRefIndex?: number | null;
  /** Callback when user hovers over a reference link in content */
  onRefHover?: (refIndex: number | null) => void;
  /** Dil kodu - referans etiketleri için (ref-1 soru vb.) */
  currentLanguage?: string;
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
// Main Component
// ============================================================================

/**
 * A rich text editor component with markdown support.
 * Built on top of react-markdown-editor-lite with Material-UI theming.
 *
 * Typing is buffered locally and parent onChange is debounced so Redux/heavy
 * parents do not re-render on every keystroke.
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
  fillHeight = false,
  references,
  hoveredRefIndex,
  onRefHover,
  currentLanguage = 'tr',
}) => {
  const theme = useTheme();
  const editorRef = useRef<MdEditorRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState(value);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const lastEmittedRef = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [refDropdownOpen, setRefDropdownOpen] = useState(false);
  const [refReplaceStart, setRefReplaceStart] = useState(0);
  const [refReplaceLength, setRefReplaceLength] = useState(0);
  const [refLinkText, setRefLinkText] = useState<string | null>(null);

  const [previewOn, setPreviewOn] = useState(false);
  const [previewContent, setPreviewContent] = useState(value);
  const previewApiRef = useRef({
    toggle: () => {},
  });
  previewApiRef.current.toggle = () => setPreviewOn((v) => !v);

  const previewPluginConfig = useRef({
    'preview-toggle': {
      onToggle: () => previewApiRef.current.toggle(),
    },
  }).current;

  // Parent dışarıdan değeri değiştirdiğinde (reset / yükleme) draft'ı senkronla
  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      lastEmittedRef.current = value;
      setDraft(value);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
  }, [value]);

  const emitToParent = useCallback((text: string) => {
    lastEmittedRef.current = text;
    onChangeRef.current(text);
  }, []);

  const flushToParent = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const current = draftRef.current;
    if (current !== lastEmittedRef.current) {
      emitToParent(current);
    }
  }, [emitToParent]);

  // Unmount'ta son karakterleri kaybetme
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const current = draftRef.current;
      if (current !== lastEmittedRef.current) {
        onChangeRef.current(current);
        lastEmittedRef.current = current;
      }
    };
  }, []);

  useEffect(() => {
    if (!onRefHover || !containerRef.current) return;
    const el = containerRef.current;
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest?.('.content-ref');
      if (target) {
        const refIdx = target.getAttribute('data-ref');
        if (refIdx != null) onRefHover(parseInt(refIdx, 10));
      }
    };
    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement;
      if (!related?.closest?.('.content-ref')) onRefHover(null);
    };
    el.addEventListener('mouseover', handleMouseOver);
    el.addEventListener('mouseout', handleMouseOut);
    return () => {
      el.removeEventListener('mouseover', handleMouseOver);
      el.removeEventListener('mouseout', handleMouseOut);
    };
  }, [onRefHover]);

  // Reset editor instance when value is cleared externally
  useEffect(() => {
    if (
      value === '' &&
      draft === '' &&
      editorRef.current &&
      typeof editorRef.current.setValue === 'function'
    ) {
      try {
        editorRef.current.setValue('');
      } catch (err) {
        console.warn('Failed to reset editor:', err);
      }
    }
  }, [value, draft]);

  const handleChange = useCallback(
    ({ text }: { text: string; html: string }) => {
      const truncated = text.length > maxLength ? text.slice(0, maxLength) : text;
      setDraft(truncated);
      draftRef.current = truncated;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        emitToParent(truncated);
      }, PARENT_SYNC_DEBOUNCE_MS);
    },
    [maxLength, emitToParent]
  );

  // Preview kapalı: markdown-it parse'ı her tuşta boşa çalışmasın
  const renderHTML = useCallback((_text: string) => '', []);

  // Önizleme paneli: açıkken draft'ı debounce ile MarkdownRenderer'a ver
  useEffect(() => {
    if (!previewOn) return;
    const timer = setTimeout(() => setPreviewContent(draft), PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, previewOn]);

  useEffect(() => {
    if (previewOn) setPreviewContent(draftRef.current);
  }, [previewOn]);

  const editorHeight = fillHeight ? '100%' : `${minHeight}px`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll('.content-ref.ref-highlighted').forEach((s) => (s as HTMLElement).classList.remove('ref-highlighted'));
    if (hoveredRefIndex != null) {
      container.querySelectorAll(`.content-ref[data-ref="${hoveredRefIndex}"]`).forEach((s) => (s as HTMLElement).classList.add('ref-highlighted'));
    }
    return () => container.querySelectorAll('.content-ref.ref-highlighted').forEach((s) => (s as HTMLElement).classList.remove('ref-highlighted'));
  }, [hoveredRefIndex]);

  // /ref slash command: show reference selector when user types /ref
  useEffect(() => {
    if (disabled || !references?.length) return;
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const textarea = container.querySelector('textarea');
      if (!textarea || e.target !== textarea) return;

      const target = textarea;
      const value = target.value;
      const start = target.selectionStart;
      const beforeCursor = value.slice(0, start);

      const openRefDropdown = (replaceStart: number, replaceLen: number, linkText: string | null) => {
        setRefReplaceStart(replaceStart);
        setRefReplaceLength(replaceLen);
        setRefLinkText(linkText);
        setRefDropdownOpen(true);
      };

      const matchWithBrackets = beforeCursor.match(REF_WITH_LINK_TEXT);
      if (matchWithBrackets) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const fullMatch = matchWithBrackets[0];
          openRefDropdown(start - fullMatch.length, fullMatch.length, matchWithBrackets[1]);
        }
      } else if (e.key === 'f' && beforeCursor === '/re') {
        setTimeout(() => {
          const v = (textarea as HTMLTextAreaElement).value;
          const s = (textarea as HTMLTextAreaElement).selectionStart;
          const b = v.slice(0, s);
          const m = b.match(REF_WITH_LINK_TEXT);
          if (m) {
            openRefDropdown(s - m[0].length, m[0].length, m[1]);
          } else if (b.endsWith(REF_TRIGGER)) {
            openRefDropdown(s - REF_LEN, REF_LEN, null);
          }
        }, 0);
      } else if (beforeCursor.endsWith(REF_TRIGGER)) {
        if (e.key === 'Enter') {
          e.preventDefault();
          openRefDropdown(start - REF_LEN, REF_LEN, null);
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown, true);
    return () => container.removeEventListener('keydown', handleKeyDown, true);
  }, [disabled, references?.length]);

  const handleRefSelect = useCallback(
    (index: number) => {
      if (!references?.[index]) return;

      const linkText = refLinkText ?? getRefDisplayLabel(references[index], index, currentLanguage);
      const toInsert = `[${linkText}](ref:${index})`;

      const replaceLen = refReplaceLength || REF_LEN;
      const text = draftRef.current;
      const before = text.slice(0, refReplaceStart);
      const after = text.slice(refReplaceStart + replaceLen);
      const newText = (before + toInsert + after).slice(0, maxLength);
      const newCursorPos = refReplaceStart + toInsert.length;

      setDraft(newText);
      draftRef.current = newText;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      emitToParent(newText);
      setRefDropdownOpen(false);
      setRefLinkText(null);

      setTimeout(() => {
        const textarea = containerRef.current?.querySelector('textarea');
        if (textarea) {
          (textarea as HTMLTextAreaElement).focus();
          (textarea as HTMLTextAreaElement).setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 50);
    },
    [references, refReplaceStart, refReplaceLength, refLinkText, emitToParent, maxLength, currentLanguage]
  );

  if (disabled) {
    return (
      <Box ref={containerRef} sx={fillHeight ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined}>
        <EditorContainer hasError={error} sx={[sx, fillHeight && { flex: 1, minHeight: 0 }].filter(Boolean) as SxProps<Theme>}>
          <TextField
            fullWidth
            multiline
            value={draft}
            inputProps={{ readOnly: true }}
            variant="outlined"
            sx={{
              height: fillHeight ? '100%' : undefined,
              minHeight: fillHeight ? minHeight : undefined,
              '& .MuiOutlinedInput-root': {
                backgroundColor: `${theme.palette.background.paper} !important`,
                color: `${theme.palette.text.primary} !important`,
                fontSize: '16px !important',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                height: fillHeight ? '100%' : undefined,
                minHeight: fillHeight ? '100%' : minHeight,
                alignItems: 'flex-start',
                '& fieldset': { borderColor: theme.palette.divider },
                '& .MuiInputBase-input': {
                  padding: '10px 15px',
                  overflowY: 'auto !important',
                },
              },
            }}
          />
        </EditorContainer>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, minHeight: 20 }}>
          <span />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 'auto' }}>
            {draft.length} / {maxLength}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      onBlur={(e) => {
        // Focus container dışına çıkınca parent'a hemen yaz
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          flushToParent();
        }
      }}
      sx={fillHeight ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined}
    >
      <EditorContainer
          hasError={error}
          sx={[
            references?.length
              ? {
                  '& .content-ref': {
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                    textUnderlineOffset: 2,
                    color: (t: { palette: { primary: { main: string } } }) => t.palette.primary.main,
                    borderRadius: 2,
                    px: 0.25,
                    transition: 'background-color 0.15s',
                    '&:hover, &.ref-highlighted': {
                      backgroundColor: (t: { palette: { primary: { main: string }; mode: string } }) =>
                        t.palette.mode === 'dark' ? `${t.palette.primary.main}30` : `${t.palette.primary.main}20`,
                    },
                  },
                }
              : {},
            sx,
            fillHeight
              ? {
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  '& .rc-md-editor': { flex: 1, minHeight: 0 },
                }
              : undefined,
          ].filter(Boolean) as SxProps<Theme>
        }
        >
        <Box
          sx={{
            display: 'flex',
            height: editorHeight,
            minHeight: fillHeight ? minHeight : undefined,
            flex: fillHeight ? 1 : undefined,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              '& .rc-md-editor': { height: '100% !important', flex: 1, minHeight: 0 },
            }}
          >
            <MdEditor
              ref={editorRef}
              value={draft}
              style={{ height: '100%', ...(fillHeight && { minHeight: '100%' }) }}
              renderHTML={renderHTML}
              onChange={handleChange}
              onBlur={flushToParent}
              placeholder={placeholder}
              view={EDITOR_VIEW_CONFIG}
              canView={EDITOR_CAN_VIEW_CONFIG}
              config={EDITOR_CONFIG}
              plugins={MD_EDITOR_PLUGINS_WITH_STYLES}
              pluginConfig={previewPluginConfig}
            />
          </Box>
          {previewOn && (
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: 'auto',
                borderLeft: `1px solid ${theme.palette.divider}`,
                px: 1.5,
                py: 1.25,
                backgroundColor: theme.palette.background.paper,
                ...getScrollbarSx(theme),
              }}
            >
              {previewContent.trim() ? (
                <MarkdownRenderer
                  content={previewContent}
                  highlightedRefIndex={hoveredRefIndex}
                  onRefHover={onRefHover}
                />
              ) : (
                <Typography variant="body2" sx={{ color: theme.palette.text.disabled }}>
                  {currentLanguage === 'tr' ? 'Önizleme burada görünecek…' : 'Preview will appear here…'}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </EditorContainer>
      <Menu
        open={refDropdownOpen}
        onClose={() => setRefDropdownOpen(false)}
        anchorEl={containerRef.current}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            maxHeight: 320,
            minWidth: 320,
            mt: 1,
            ...getScrollbarSx(theme),
          },
        }}
      >
        {references?.map((ref, idx) => (
          <MenuItem
            key={idx}
            onClick={() => handleRefSelect(idx)}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <RefTypeIcon type={ref.type} />
            </ListItemIcon>
            <ListItemText
              primary={getRefDisplayLabel(ref, idx, currentLanguage)}
              secondary={ref.type === 'link' && ref.content && ref.content.length > 60 ? ref.content.slice(0, 60) + '...' : undefined}
              primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </MenuItem>
        ))}
      </Menu>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, minHeight: 20 }}>
        {error && helperText ? (
          <ErrorText variant="caption">{helperText}</ErrorText>
        ) : (
          <span />
        )}
        <Typography
          variant="caption"
          sx={{
            color: draft.length >= maxLength
              ? theme.palette.error.main
              : theme.palette.text.secondary,
            ml: 'auto',
          }}
        >
          {draft.length} / {maxLength}
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
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.fillHeight === nextProps.fillHeight &&
    prevProps.hoveredRefIndex === nextProps.hoveredRefIndex &&
    prevProps.references === nextProps.references &&
    prevProps.currentLanguage === nextProps.currentLanguage
  );
};

export default React.memo(RichTextEditor, arePropsEqual);
