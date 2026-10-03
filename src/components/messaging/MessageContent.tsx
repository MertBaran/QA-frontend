import React, { useState, useEffect } from 'react';
import { Box, Typography, Link, CircularProgress } from '@mui/material';
import ProfileAvatar from '../ui/ProfileAvatar';
import { stripRefLinksForDisplay } from '../../utils/refLinkDisplay';
import { t } from '../../utils/translations';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import type { Question } from '../../types/question';
import type { Answer } from '../../types/answer';

const PREVIEW_LENGTH = 80;
const URL_REGEX = /(https?:\/\/[^\s<>"']+)|(\/questions\/[a-zA-Z0-9_-]+)(#answer-[a-zA-Z0-9_-]+)?/g;

interface ParsedSegment {
  type: 'text' | 'url';
  value: string;
  questionId?: string;
  answerId?: string;
  isPlatform?: boolean;
}

interface InlineFormatSegment {
  type: 'text' | 'bold' | 'italic' | 'strikethrough';
  value: string;
}

/** Strip **bold**, *italic*, ~~strikethrough~~ markers for plain text preview. */
export function stripInlineFormat(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*([\s\S]*?)\*\*/g, '$1')
    .replace(/~~([\s\S]*?)~~/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1');
}

/** Parse **bold**, *italic*, ~~strikethrough~~ in text. Match ~~ and ** before * to avoid conflicts. */
function parseInlineFormat(text: string): InlineFormatSegment[] {
  const result: InlineFormatSegment[] = [];
  const re = /(~~[^~]*~~|\*\*[^*]*\*\*|\*[^*]*\*)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      result.push({ type: 'text', value: text.slice(lastIndex, m.index) });
    }
    const raw = m[1];
    if (raw.startsWith('~~') && raw.endsWith('~~')) {
      result.push({ type: 'strikethrough', value: raw.slice(2, -2) });
    } else if (raw.startsWith('**') && raw.endsWith('**')) {
      result.push({ type: 'bold', value: raw.slice(2, -2) });
    } else if (raw.startsWith('*') && raw.endsWith('*')) {
      result.push({ type: 'italic', value: raw.slice(1, -1) });
    } else {
      result.push({ type: 'text', value: raw });
    }
    lastIndex = m.index + raw.length;
  }
  if (lastIndex < text.length) {
    result.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return result;
}

function parseMessageContent(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const resetRegex = () => {
    URL_REGEX.lastIndex = 0;
  };

  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const fullMatch = match[0];
    let questionId: string | undefined;
    let answerId: string | undefined;
    let isPlatform = false;

    if (match[1]) {
      const url = match[1];
      try {
        const parsed = new URL(url, origin);
        const path = parsed.pathname;
        const hash = parsed.hash || '';
        const qMatch = path.match(/\/questions\/([a-zA-Z0-9_-]+)/);
        const aMatch = hash.match(/#answer-([a-zA-Z0-9_-]+)/);
        if (qMatch && (parsed.origin === origin || parsed.hostname === new URL(origin).hostname)) {
          questionId = qMatch[1];
          answerId = aMatch?.[1];
          isPlatform = true;
        }
      } catch {
        // Invalid URL
      }
    } else if (match[2]) {
      questionId = match[2].replace(/^\/questions\//, '').trim();
      answerId = match[3]?.replace(/^#answer-/, '').trim();
      isPlatform = !!questionId;
    }

    segments.push({
      type: 'url',
      value: fullMatch,
      questionId,
      answerId,
      isPlatform: isPlatform && !!questionId,
    });
    lastIndex = match.index + fullMatch.length;
  }
  resetRegex();

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return segments;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Splits text by highlightTerm (case-insensitive) and returns React nodes with matches wrapped in <mark>. */
function highlightText(text: string, highlightTerm: string): React.ReactNode[] {
  if (!highlightTerm.trim()) return [text];
  const re = new RegExp(`(${escapeRegex(highlightTerm)})`, 'gi');
  const parts = text.split(re);
  // With capturing group, odd-indexed parts are the matches
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        style={{
          backgroundColor: 'rgba(255, 193, 7, 0.6)',
          padding: '0 2px',
          borderRadius: 2,
        }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

interface MessageContentProps {
  content: string;
  isOwn: boolean;
  currentLanguage: string;
  highlightTerm?: string;
  /** Yanıtlanan mesajın id'si; verilirse önizleme tıklanabilir ve tıklanınca bu id'ye scroll edilir */
  replyToMessageId?: string;
  onReplyPreviewClick?: (messageId: string) => void;
}

const REPLY_REGEX = /^\[reply:([^\]]+)\]\n([^\n]+)\n\n/;

/** Metinde platform soru/cevap linki var mı; varsa questionId ve isteğe bağlı answerId döndür. */
function extractPlatformLinkFromText(text: string): { questionId: string; answerId?: string } | null {
  if (!text || typeof text !== 'string') return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  // Tam URL veya /questions/xxx#answer-yyy
  const urlMatch = text.match(/(https?:\/\/[^\s<>"']+)/);
  if (urlMatch) {
    try {
      const parsed = new URL(urlMatch[1], origin);
      const q = parsed.pathname.match(/\/questions\/([a-zA-Z0-9_-]+)/);
      const a = parsed.hash.match(/#answer-([a-zA-Z0-9_-]+)/);
      if (q && (parsed.origin === origin || parsed.hostname === new URL(origin).hostname)) {
        return { questionId: q[1], answerId: a?.[1] };
      }
    } catch {
      // ignore
    }
  }
  const pathMatch = text.match(/\/questions\/([a-zA-Z0-9_-]+)(#answer-([a-zA-Z0-9_-]+))?/);
  if (pathMatch) return { questionId: pathMatch[1], answerId: pathMatch[3] };
  return null;
}

/** Yanıt önizlemesi için ham metni temizle: **kalın**, [voice], [reply:...], ref linkleri vb. */
function formatReplyPreview(raw: string, voiceLabel: string = 'Ses kaydı'): string {
  let s = stripInlineFormat(raw);
  s = stripRefLinksForDisplay(s);
  if (s.startsWith('[voice]')) {
    s = voiceLabel + (s.includes('\n\n') ? ' • ' + s.slice(s.indexOf('\n\n') + 2).trim() : '');
  }
  s = s.replace(/^\[reply:[^\]]+\]\n[^\n]+\n\n?/g, '').trim();
  return s || raw;
}

const MessageContent: React.FC<MessageContentProps> = ({
  content,
  isOwn,
  currentLanguage,
  highlightTerm,
  replyToMessageId,
  onReplyPreviewClick,
}) => {
  const replyMatch = content.match(REPLY_REGEX);
  const mainContent = replyMatch ? content.slice(replyMatch[0].length) : content;
  const replyPreviewRaw = replyMatch?.[2] ?? null;
  const replyPreview = replyPreviewRaw
    ? formatReplyPreview(replyPreviewRaw, t('voice_message', currentLanguage))
    : null;
  const replyPreviewPlatformLink = replyPreviewRaw ? extractPlatformLinkFromText(replyPreviewRaw) : null;
  const segments = parseMessageContent(mainContent);

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {(replyPreview || replyPreviewPlatformLink) && (
        <Box
          component={replyToMessageId && onReplyPreviewClick ? 'button' : 'div'}
          type={replyToMessageId && onReplyPreviewClick ? 'button' : undefined}
          onClick={
            replyToMessageId && onReplyPreviewClick
              ? () => onReplyPreviewClick(replyToMessageId)
              : undefined
          }
          sx={{
            borderLeft: 2,
            borderColor: 'inherit',
            pl: 1,
            ml: 0.5,
            opacity: 0.85,
            textAlign: 'left',
            width: '100%',
            cursor: replyToMessageId && onReplyPreviewClick ? 'pointer' : 'default',
            bgcolor: 'transparent',
            border: 'none',
            '&:hover':
              replyToMessageId && onReplyPreviewClick
                ? { opacity: 1, bgcolor: 'action.hover' }
                : undefined,
          }}
        >
          {replyPreviewPlatformLink ? (
            <Box onClick={(e: React.MouseEvent) => e.stopPropagation()} sx={{ width: '100%' }}>
              <PlatformLinkPreview
                questionId={replyPreviewPlatformLink.questionId}
                answerId={replyPreviewPlatformLink.answerId}
                isOwn={isOwn}
                currentLanguage={currentLanguage}
                compact
              />
            </Box>
          ) : (
            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
              {replyPreview}
            </Typography>
          )}
        </Box>
      )}
      {segments.map((seg, idx) => {
        if (seg.type === 'text') {
          const inlineSegments = parseInlineFormat(seg.value);
          const renderWithHighlight = (val: string) =>
            highlightTerm ? highlightText(val, highlightTerm) : val;
          return (
            <Typography
              key={idx}
              variant="body2"
              component="span"
              sx={{ width: '100%', fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block' }}
            >
              {inlineSegments.map((isg, i) => {
                if (isg.type === 'text') return <React.Fragment key={i}>{renderWithHighlight(isg.value)}</React.Fragment>;
                if (isg.type === 'bold') return <strong key={i}>{renderWithHighlight(isg.value)}</strong>;
                if (isg.type === 'italic') return <em key={i}>{renderWithHighlight(isg.value)}</em>;
                if (isg.type === 'strikethrough') return <span key={i} style={{ textDecoration: 'line-through' }}>{renderWithHighlight(isg.value)}</span>;
                return <React.Fragment key={i}>{renderWithHighlight(isg.value)}</React.Fragment>;
              })}
            </Typography>
          );
        }
        if (seg.type === 'url' && seg.isPlatform && seg.questionId) {
          return (
            <PlatformLinkPreview
              key={idx}
              questionId={seg.questionId}
              answerId={seg.answerId}
              isOwn={isOwn}
              currentLanguage={currentLanguage}
            />
          );
        }
        return (
          <Link
            key={idx}
            href={seg.value}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: 'inherit',
              textDecoration: 'underline',
              fontSize: '0.875rem',
              wordBreak: 'break-all',
              '&:hover': { opacity: 0.85 },
            }}
          >
            {seg.value}
          </Link>
        );
      })}
    </Box>
  );
};

interface PlatformLinkPreviewProps {
  questionId: string;
  answerId?: string;
  isOwn: boolean;
  currentLanguage: string;
  /** Yanıt önizlemesi gibi dar alanlarda daha küçük gösterim */
  compact?: boolean;
}

const PlatformLinkPreview: React.FC<PlatformLinkPreviewProps> = ({
  questionId,
  answerId,
  isOwn,
  currentLanguage,
  compact = false,
}) => {
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const q = await questionService.getQuestionById(questionId);
        if (cancelled) return;
        if (q) {
          setQuestion(q);
          if (answerId) {
            const a = await answerService.getAnswerByQuestionAndId(questionId, answerId);
            if (!cancelled) setAnswer(a ?? null);
          }
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [questionId, answerId]);

  const handleClick = () => {
    const path = answerId
      ? `/questions/${questionId}#answer-${answerId}`
      : `/questions/${questionId}`;
    window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 0.5 : 1,
          p: compact ? 0.5 : 1,
          borderRadius: 1,
          border: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: isOwn ? 'primary.dark' : 'action.hover',
        }}
      >
        <CircularProgress size={compact ? 16 : 20} sx={{ color: 'inherit' }} />
        <Typography variant="caption" sx={compact ? { fontSize: '0.7rem' } : undefined}>...</Typography>
      </Box>
    );
  }

  if (error || (!question && !answer)) {
    const fallbackUrl = answerId
      ? `${window.location.origin}/questions/${questionId}#answer-${answerId}`
      : `${window.location.origin}/questions/${questionId}`;
    return (
      <Link
        href={fallbackUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          color: 'inherit',
          textDecoration: 'underline',
          fontSize: '0.875rem',
          wordBreak: 'break-all',
          '&:hover': { opacity: 0.85 },
        }}
      >
        {fallbackUrl}
      </Link>
    );
  }

  const displayQuestion = question;
  const displayAnswer = answer;
  const avatarSrc = displayAnswer
    ? (displayAnswer.userInfo?.profile_image || displayAnswer.author?.avatar)
    : (displayQuestion?.userInfo?.profile_image || displayQuestion?.author?.avatar);
  const ownerId = displayAnswer
    ? (displayAnswer.userInfo?._id ?? displayAnswer.author?.id)
    : (displayQuestion?.userInfo?._id ?? displayQuestion?.author?.id);
  const authorName = displayAnswer
    ? (displayAnswer.author?.name ?? displayAnswer.userInfo?.name ?? '—')
    : (displayQuestion?.author?.name ?? displayQuestion?.userInfo?.name ?? '—');
  const title = displayAnswer
    ? (displayAnswer.questionSummary ?? displayQuestion?.summary ?? '—')
    : (displayQuestion?.summary ?? '—');
  const contentDisplay = displayAnswer
    ? stripRefLinksForDisplay(displayAnswer.content)
    : stripRefLinksForDisplay(displayQuestion?.detail);
  const contentPreview = contentDisplay?.slice(0, PREVIEW_LENGTH) ?? '';
  const contentSuffix = contentDisplay && contentDisplay.length > PREVIEW_LENGTH ? '...' : '';

  return (
    <Box
      component="button"
      type="button"
      onClick={handleClick}
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: compact ? 0.5 : 1,
        p: compact ? 0.5 : 1,
        borderRadius: 1,
        border: `1px solid ${isOwn ? 'rgba(255,255,255,0.4)' : theme.palette.divider}`,
        backgroundColor: isOwn ? 'rgba(0,0,0,0.2)' : theme.palette.background.paper,
        color: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.2s, background-color 0.2s',
        '&:hover': {
          borderColor: isOwn ? 'rgba(255,255,255,0.7)' : theme.palette.primary.main,
          backgroundColor: isOwn ? 'rgba(0,0,0,0.3)' : (theme.palette.mode === 'dark' ? `${theme.palette.primary.main}15` : `${theme.palette.primary.main}0a`),
        },
      })}
    >
      <ProfileAvatar
        src={avatarSrc || undefined}
        ownerId={ownerId}
        fallbackName={authorName}
        sx={{ width: compact ? 22 : 28, height: compact ? 22 : 28, flexShrink: 0 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit', mb: 0.25, fontSize: compact ? '0.7rem' : '0.8125rem' }} noWrap>
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.85, fontSize: compact ? '0.65rem' : '0.75rem' }} noWrap display="block">
          {contentPreview}{contentSuffix}
        </Typography>
      </Box>
    </Box>
  );
};

export default MessageContent;
