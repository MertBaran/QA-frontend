import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Box, Chip, Paper, Popper, Portal, Typography } from '@mui/material';
import { ChatBubbleOutline, Comment, ThumbDown, ThumbUp } from '@mui/icons-material';
import ProfileAvatar from '../ui/ProfileAvatar';
import ContentTime from '../ui/ContentTime';
import DeferredImage from '../ui/DeferredImage';
import MarkdownRenderer from '../ui/MarkdownRenderer';
import { contentAssetService } from '../../services/contentAssetService';
import { commentService } from '../../services/commentService';
import { answerService } from '../../services/answerService';
import { questionService } from '../../services/questionService';
import { useAppSelector } from '../../store/hooks';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import { t } from '../../utils/translations';
import type { Answer } from '../../types/answer';
import type { CommentItem } from '../../types/comment';
import type { Question } from '../../types/question';

export interface FeaturedAnswerPreview {
  id: string;
  content: string;
  authorName: string;
  authorAvatar?: string;
  authorId?: string;
  createdAt?: string;
  comments: CommentItem[];
}

const questionPreviewCache = new Map<string, Promise<Question | null>>();
const answerPreviewCache = new Map<string, Promise<Answer | null>>();
const commentPreviewCache = new Map<string, Promise<CommentItem[]>>();

function loadQuestionForPreview(id: string): Promise<Question | null> {
  const cached = questionPreviewCache.get(id);
  if (cached) return cached;
  const pending = questionService.getQuestionById(id).then(question => {
    if (!question) questionPreviewCache.delete(id);
    return question;
  });
  questionPreviewCache.set(id, pending);
  return pending;
}

function loadAnswerForPreview(id: string): Promise<Answer | null> {
  const cached = answerPreviewCache.get(id);
  if (cached) return cached;
  const pending = answerService.getAnswerById(id).then(answer => {
    if (!answer) answerPreviewCache.delete(id);
    return answer;
  });
  answerPreviewCache.set(id, pending);
  return pending;
}

function loadCommentsForPreview(questionId: string): Promise<CommentItem[]> {
  const cached = commentPreviewCache.get(questionId);
  if (cached) return cached;
  const pending = commentService.listForQuestion(questionId).catch(() => [] as CommentItem[]);
  commentPreviewCache.set(questionId, pending);
  return pending;
}

const PREVIEW_DELAY_MS = 1000;
export const ANCESTOR_PREVIEW_DELAY_MS = 500;
const PREVIEW_HIDE_MS = 220;

let homePreviewLocks = 0;
const homePreviewLockListeners = new Set<() => void>();

function notifyHomePreviewLocks() {
  homePreviewLockListeners.forEach(listener => listener());
}

/** Soy çekmecesi açıkken ana sayfa kart önizlemesi açılmasın. */
export function setHomePreviewSuppressed(suppressed: boolean) {
  homePreviewLocks = Math.max(0, homePreviewLocks + (suppressed ? 1 : -1));
  notifyHomePreviewLocks();
}

export function useDelayedQuestionPreview(options?: { respectHomeLock?: boolean; delayMs?: number }) {
  const respectHomeLock = options?.respectHomeLock ?? false;
  const delayMs = options?.delayMs ?? PREVIEW_DELAY_MS;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [featuredAnswer, setFeaturedAnswer] = useState<FeaturedAnswerPreview | null>(null);
  const overTarget = useRef(false);
  const overPreview = useRef(false);
  const showTimer = useRef<number>();
  const hideTimer = useRef<number>();
  const ticket = useRef(0);
  const [homeLocked, setHomeLocked] = useState(homePreviewLocks > 0);

  const dismiss = useCallback(() => {
    overTarget.current = false;
    overPreview.current = false;
    ticket.current += 1;
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
    setAnchorEl(null);
    setQuestion(null);
    setFeaturedAnswer(null);
  }, []);

  useEffect(() => {
    if (!respectHomeLock) return;
    const listener = () => setHomeLocked(homePreviewLocks > 0);
    homePreviewLockListeners.add(listener);
    return () => {
      homePreviewLockListeners.delete(listener);
    };
  }, [respectHomeLock]);

  useEffect(() => {
    if (respectHomeLock && homeLocked) dismiss();
  }, [respectHomeLock, homeLocked, dismiss]);

  useEffect(() => () => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
  }, []);

  const hideIfIdle = () => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (!overTarget.current && !overPreview.current) {
        setAnchorEl(null);
        setQuestion(null);
        setFeaturedAnswer(null);
      }
    }, PREVIEW_HIDE_MS);
  };

  const bind = (next: Question) => ({
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      if (respectHomeLock && homePreviewLocks > 0) return;
      overTarget.current = true;
      ticket.current += 1;
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(showTimer.current);
      const target = event.currentTarget;
      showTimer.current = window.setTimeout(() => {
        if (!overTarget.current) return;
        if (respectHomeLock && homePreviewLocks > 0) return;
        setAnchorEl(target);
        setQuestion(next);
        setFeaturedAnswer(null);
      }, delayMs);
    },
    onMouseLeave: () => {
      overTarget.current = false;
      window.clearTimeout(showTimer.current);
      hideIfIdle();
    },
  });

  const bindAnswer = (answer: Answer) => ({
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      if (respectHomeLock && homePreviewLocks > 0) return;
      if (!answer.questionId) return;
      overTarget.current = true;
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(showTimer.current);
      const mine = ticket.current + 1;
      ticket.current = mine;
      const target = event.currentTarget;
      const questionId = answer.questionId;
      showTimer.current = window.setTimeout(async () => {
        if (ticket.current !== mine || !overTarget.current) return;
        if (respectHomeLock && homePreviewLocks > 0) return;
        const [loadedQuestion, comments] = await Promise.all([
          loadQuestionForPreview(questionId),
          loadCommentsForPreview(questionId),
        ]);
        if (ticket.current !== mine || !overTarget.current || !loadedQuestion) return;
        setAnchorEl(target);
        setQuestion(loadedQuestion);
        setFeaturedAnswer({
          id: answer.id,
          content: answer.content,
          authorName: answer.userInfo?.name || answer.author.name,
          authorAvatar: answer.userInfo?.profile_image || answer.author.avatar,
          authorId: answer.userInfo?._id || answer.author.id,
          createdAt: answer.createdAt,
          comments: comments.filter(comment =>
            comment.targetType === 'answer' && comment.targetId === answer.id && !comment.deleted
          ),
        });
      }, delayMs);
    },
    onMouseDown: () => {
      window.clearTimeout(showTimer.current);
      ticket.current += 1;
    },
    onMouseLeave: () => {
      overTarget.current = false;
      window.clearTimeout(showTimer.current);
      hideIfIdle();
    },
  });

  const bindQuestionId = (questionId: string) => ({
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      if (respectHomeLock && homePreviewLocks > 0) return;
      if (!questionId) return;
      overTarget.current = true;
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(showTimer.current);
      const mine = ticket.current + 1;
      ticket.current = mine;
      const target = event.currentTarget;
      showTimer.current = window.setTimeout(async () => {
        if (ticket.current !== mine || !overTarget.current) return;
        if (respectHomeLock && homePreviewLocks > 0) return;
        const loaded = await loadQuestionForPreview(questionId);
        if (ticket.current !== mine || !overTarget.current || !loaded) return;
        setAnchorEl(target);
        setQuestion(loaded);
        setFeaturedAnswer(null);
      }, delayMs);
    },
    onMouseLeave: () => {
      overTarget.current = false;
      window.clearTimeout(showTimer.current);
      hideIfIdle();
    },
  });

  const bindAnswerById = (answerId: string, questionId: string) => ({
    onMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      if (respectHomeLock && homePreviewLocks > 0) return;
      if (!answerId || !questionId) return;
      overTarget.current = true;
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(showTimer.current);
      const mine = ticket.current + 1;
      ticket.current = mine;
      const target = event.currentTarget;
      showTimer.current = window.setTimeout(async () => {
        if (ticket.current !== mine || !overTarget.current) return;
        if (respectHomeLock && homePreviewLocks > 0) return;
        const [loadedQuestion, loadedAnswer, comments] = await Promise.all([
          loadQuestionForPreview(questionId),
          loadAnswerForPreview(answerId),
          loadCommentsForPreview(questionId),
        ]);
        if (ticket.current !== mine || !overTarget.current || !loadedQuestion || !loadedAnswer) return;
        setAnchorEl(target);
        setQuestion(loadedQuestion);
        setFeaturedAnswer({
          id: loadedAnswer.id,
          content: loadedAnswer.content,
          authorName: loadedAnswer.userInfo?.name || loadedAnswer.author.name,
          authorAvatar: loadedAnswer.userInfo?.profile_image || loadedAnswer.author.avatar,
          authorId: loadedAnswer.userInfo?._id || loadedAnswer.author.id,
          createdAt: loadedAnswer.createdAt,
          comments: comments.filter(comment =>
            comment.targetType === 'answer' && comment.targetId === loadedAnswer.id && !comment.deleted
          ),
        });
      }, delayMs);
    },
    onMouseLeave: () => {
      overTarget.current = false;
      window.clearTimeout(showTimer.current);
      hideIfIdle();
    },
  });

  const previewHandlers = {
    onMouseEnter: () => {
      overPreview.current = true;
      window.clearTimeout(hideTimer.current);
    },
    onMouseLeave: () => {
      overPreview.current = false;
      hideIfIdle();
    },
  };

  return { bind, bindAnswer, bindQuestionId, bindAnswerById, dismiss, anchorEl, question, featuredAnswer, previewHandlers };
}

function clip(text: string, limit: number): string {
  const value = text.trim();
  return value.length > limit ? `${value.slice(0, limit)}...` : value;
}

const AnswerPreviewSection: React.FC<{
  answer: FeaturedAnswerPreview;
  answerCount: number;
  currentLanguage: string;
}> = ({ answer, answerCount, currentLanguage }) => {
  const visibleComments = answer.comments.slice(0, 4);
  return (
    <Box sx={{ mt: 2.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ fontWeight: 700, borderBottom: 2, borderColor: 'primary.main', pb: 0.5, display: 'inline-block' }}>
        {t('answers', currentLanguage)} ({answerCount})
      </Typography>
      <Box
        sx={{
          mt: 1.5,
          p: 1.5,
          borderRadius: 1.5,
          border: '2px solid',
          borderColor: 'primary.main',
          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.72)',
          boxShadow: theme => `0 0 0 4px ${theme.palette.primary.main}22`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <ProfileAvatar
            src={answer.authorAvatar}
            ownerId={answer.authorId}
            fallbackName={answer.authorName}
            sx={{ width: 28, height: 28 }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>{answer.authorName}</Typography>
            {answer.createdAt && (
              <ContentTime value={answer.createdAt} currentLanguage={currentLanguage} variant="caption" />
            )}
          </Box>
        </Box>
        <MarkdownRenderer content={clip(answer.content, 900)} />
      </Box>
      <Typography variant="body2" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>
        {t('comments', currentLanguage)} ({answer.comments.length})
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {visibleComments.map(comment => (
          <Box key={comment.id} sx={{ p: 1.25, borderRadius: 1.5, border: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <ProfileAvatar
                src={comment.authorAvatar}
                ownerId={comment.userId}
                fallbackName={comment.authorName}
                sx={{ width: 22, height: 22 }}
              />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{comment.authorName}</Typography>
              <ContentTime value={comment.createdAt} currentLanguage={currentLanguage} variant="caption" />
            </Box>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {clip(comment.body, 320)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

interface QuestionHoverPreviewProps {
  question: Question | null;
  anchorEl: HTMLElement | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  featuredAnswer?: FeaturedAnswerPreview | null;
  /** Kartın altında, kart genişliğinde. Soy önizlemesi daha büyük ve detay sayfasına daha yakın. */
  placement?: 'below' | 'page';
}

const QuestionHoverPreview: React.FC<QuestionHoverPreviewProps> = ({
  question,
  anchorEl,
  onMouseEnter,
  onMouseLeave,
  featuredAnswer = null,
  placement = 'below',
}) => {
  const { currentLanguage } = useAppSelector(state => state.language);
  const [thumbUrl, setThumbUrl] = useState<string | undefined>();
  const pagePreview = placement === 'page';
  const anchorWidth = anchorEl?.getBoundingClientRect().width ?? 0;
  const paperRef = useRef<HTMLDivElement>(null);
  const maskId = `preview-dim-${useId().replace(/:/g, '')}`;
  const [spots, setSpots] = useState<{ card: DOMRect; preview: DOMRect; vw: number; vh: number } | null>(null);
  const open = Boolean(question && anchorEl);

  useEffect(() => {
    let cancelled = false;
    const thumb = question?.thumbnail;
    if (!question || !thumb?.key) {
      setThumbUrl(undefined);
      return;
    }
    if (thumb.url) {
      setThumbUrl(thumb.url);
      return;
    }
    setThumbUrl(undefined);
    contentAssetService
      .resolveAssetUrl({
        key: thumb.key,
        type: 'question-thumbnail',
        entityId: question.id,
      })
      .then(url => {
        if (!cancelled) setThumbUrl(url);
      })
      .catch(() => {
        if (!cancelled) setThumbUrl(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [question]);

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setSpots(null);
      return;
    }
    let frame = 0;
    const measure = () => {
      const preview = paperRef.current?.getBoundingClientRect();
      if (!preview || preview.width === 0) return;
      setSpots({
        card: anchorEl.getBoundingClientRect(),
        preview,
        vw: document.documentElement.clientWidth,
        vh: document.documentElement.clientHeight,
      });
    };
    const started = performance.now();
    const loop = (now: number) => {
      measure();
      if (now - started < 480) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, anchorEl, question, featuredAnswer]);

  const detail = question?.detail ?? '';
  const detailLimit = pagePreview ? 1800 : 900;
  const previewDetail = detail.length > detailLimit ? `${detail.slice(0, detailLimit)}...` : detail;
  const thumbSize = pagePreview ? 96 : 72;

  const pad = 8;
  const hole = (rect: DOMRect) => ({
    x: rect.left - pad,
    y: rect.top - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  });

  return (
    <>
    {open && spots && (
      <Portal>
        <Box
          data-preview-dim={pagePreview ? 'ancestor' : 'home'}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: theme => theme.zIndex.modal + 1,
            pointerEvents: 'none',
            '@keyframes previewDimIn': {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
            animation: 'previewDimIn 220ms ease-out',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        >
          <svg width="100%" height="100%" viewBox={`0 0 ${spots.vw} ${spots.vh}`} preserveAspectRatio="none">
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
                <rect width={spots.vw} height={spots.vh} fill="white" />
                <rect {...hole(spots.card)} rx="12" fill="black" />
                <rect {...hole(spots.preview)} rx="12" fill="black" />
              </mask>
            </defs>
            <rect
              width={spots.vw}
              height={spots.vh}
              fill={pagePreview ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.38)'}
              mask={`url(#${maskId})`}
            />
          </svg>
        </Box>
      </Portal>
    )}
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement={pagePreview ? 'right-start' : 'bottom-start'}
      modifiers={
        pagePreview
          ? [
              { name: 'offset', options: { offset: [16, 0] } },
              { name: 'flip', options: { fallbackPlacements: ['left-start'] } },
              { name: 'preventOverflow', options: { padding: 12 } },
            ]
          : [
              { name: 'offset', options: { offset: [0, 8] } },
              { name: 'flip', enabled: false },
              { name: 'preventOverflow', enabled: false },
            ]
      }
      sx={{ zIndex: theme => theme.zIndex.modal + 2 }}
    >
      {question && (
        <Paper
          ref={paperRef}
          elevation={8}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          sx={(theme) => ({
            width: pagePreview ? 'min(880px, calc(100vw - 48px))' : anchorWidth || '100%',
            maxHeight: pagePreview ? 'min(82vh, 760px)' : 'min(62vh, 540px)',
            overflow: 'auto',
            p: pagePreview ? 3 : 2.5,
            borderRadius: 2,
            border: '2px solid',
            borderColor: 'primary.main',
            ...getScrollbarSx(theme),
            '@keyframes previewReveal': {
              from: { opacity: 0, transform: 'translateY(-12px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
            animation: 'previewReveal 420ms ease-out',
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          })}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 1.5,
              pb: 1,
              borderBottom: 1,
              borderColor: 'primary.main',
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {t('content_preview', currentLanguage)}
          </Typography>
          <Box sx={featuredAnswer ? { position: 'relative', borderRadius: 1, '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.07)',
            pointerEvents: 'none',
            borderRadius: 1,
          } } : undefined}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <ProfileAvatar
              src={question.userInfo?.profile_image || question.author.avatar}
              ownerId={question.userInfo?._id || question.author.id}
              fallbackName={question.userInfo?.name || question.author.name}
              sx={{ width: pagePreview ? 44 : 36, height: pagePreview ? 44 : 36 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant={pagePreview ? 'subtitle1' : 'body2'} sx={{ fontWeight: 700 }} noWrap>
                {question.userInfo?.name || question.author.name}
              </Typography>
              <ContentTime value={question.createdAt} currentLanguage={currentLanguage} variant="caption" />
            </Box>
          </Box>
          {question.category && (
            <Chip label={question.category} size="small" sx={{ mb: 1.5 }} />
          )}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant={pagePreview ? 'h4' : 'h5'}
                sx={{ fontWeight: 700, mb: 1.5, wordBreak: 'break-word', fontSize: pagePreview ? undefined : '1.35rem' }}
              >
                {question.summary}
              </Typography>
              <MarkdownRenderer content={previewDetail} />
            </Box>
            {question.thumbnail?.key && (
              <Box
                sx={{
                  width: thumbSize,
                  height: thumbSize,
                  flexShrink: 0,
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <DeferredImage src={thumbUrl} alt={question.summary} />
              </Box>
            )}
          </Box>
          {(question.tags?.length ?? 0) > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {question.tags.map(tag => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 2, color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThumbUp sx={{ fontSize: 18 }} />
              <Typography variant="body2">{question.likesCount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ThumbDown sx={{ fontSize: 18 }} />
              <Typography variant="body2">{question.dislikesCount}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Comment sx={{ fontSize: 18, transform: 'rotate(180deg)' }} />
              <Typography variant="body2">{question.answers}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ChatBubbleOutline sx={{ fontSize: 18 }} />
              <Typography variant="body2">{question.commentCount ?? 0}</Typography>
            </Box>
          </Box>
          </Box>
          {featuredAnswer ? (
            <AnswerPreviewSection
              answer={featuredAnswer}
              answerCount={question.answers}
              currentLanguage={currentLanguage}
            />
          ) : pagePreview ? (
            <Box sx={{ mt: 2.5, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 3, mb: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, borderBottom: 2, borderColor: 'primary.main', pb: 0.5 }}>
                  {t('answers', currentLanguage)} ({question.answers})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('comments', currentLanguage)} ({question.commentCount ?? 0})
                </Typography>
              </Box>
            </Box>
          ) : null}
        </Paper>
      )}
    </Popper>
    </>
  );
};

export default QuestionHoverPreview;
