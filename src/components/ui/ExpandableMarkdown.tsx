import React, { useState, useRef, useEffect } from 'react';
import { Box, Button, useTheme } from '@mui/material';
import MarkdownRenderer from './MarkdownRenderer';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';

/** Karakter limiti: Bu uzunluktan sonra "Devamını oku" ile genişletir */
const DEFAULT_DISPLAY_MAX_LENGTH = 600;
/** Yükseklik limiti (px): Bu yükseklikten sonra "Devamını oku" ile genişletir (görsel yoğun içerik için) */
const DEFAULT_MAX_HEIGHT = 420;

function truncateAtLength(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  const lastNewline = cut.lastIndexOf('\n');
  const cutAt = Math.max(lastSpace, lastNewline, Math.floor(maxLength * 0.8));
  return cut.slice(0, cutAt > 0 ? cutAt : maxLength) + '...';
}

interface ExpandableMarkdownProps {
  content: string;
  maxLength?: number;
  maxHeight?: number;
  className?: string;
}

/**
 * İçeriği kısaltır (karakter + yükseklik), tek "Devamını oku" ile tamamını gösterir.
 */
const ExpandableMarkdown: React.FC<ExpandableMarkdownProps> = ({
  content,
  maxLength = DEFAULT_DISPLAY_MAX_LENGTH,
  maxHeight = DEFAULT_MAX_HEIGHT,
  className,
}) => {
  const theme = useTheme();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [expanded, setExpanded] = useState(false);
  const [needsHeightExpand, setNeedsHeightExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const needsCharExpand = content.length > maxLength;
  const displayContent =
    needsCharExpand && !expanded ? truncateAtLength(content, maxLength) : content;

  useEffect(() => {
    const el = contentRef.current;
    if (!el || expanded) return;

    const checkHeight = () => {
      setNeedsHeightExpand(el.scrollHeight > maxHeight);
    };

    checkHeight();

    const ro = new ResizeObserver(checkHeight);
    ro.observe(el);

    return () => ro.disconnect();
  }, [displayContent, expanded, maxHeight]);

  if (!content) return null;

  const showExpandButton = (needsCharExpand || needsHeightExpand) && !expanded;

  return (
    <Box className={className} sx={{ maxWidth: '100%', overflowWrap: 'break-word' }}>
      <Box
        ref={contentRef}
        sx={{
          maxWidth: '100%',
          overflow: showExpandButton ? 'hidden' : 'visible',
          maxHeight: showExpandButton ? maxHeight : 'none',
        }}
      >
        <MarkdownRenderer content={displayContent} />
      </Box>
      {(needsCharExpand || needsHeightExpand) ? (
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: theme.palette.primary.main,
              px: 0,
              minWidth: 'auto',
              '&:hover': {
                bgcolor: 'transparent',
                textDecoration: 'underline',
              },
            }}
          >
            {expanded ? t('show_less', currentLanguage) : t('read_more', currentLanguage)}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
};

export default ExpandableMarkdown;
