import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogContent,
  Pagination,
  Tooltip,
} from '@mui/material';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import ProfileAvatar from '../ui/ProfileAvatar';
import ItemDetailPopup, { truncateDescription } from '../ui/ItemDetailPopup';
import { OpenInNew, YouTube, Download, InsertDriveFile, PictureAsPdf, Description, Article, TableChart } from '@mui/icons-material';
import { t } from '../../utils/translations';
import { contentAssetService } from '../../services/contentAssetService';
import { questionService } from '../../services/questionService';
import { answerService, transformAnswerData } from '../../services/answerService';
import { commentService } from '../../services/commentService';
import { showErrorToast } from '../../utils/notificationUtils';
import { stripRefLinksForDisplay } from '../../utils/refLinkDisplay';
import { filledMetadata, filledReferences } from '../../utils/filledEntries';
import type { Question } from '../../types/question';
import type { Answer } from '../../types/answer';
import type { CommentItem } from '../../types/comment';

const PREVIEW_LENGTH = 80;

const FILES_PER_PAGE = 4;

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i;
const PDF_EXTENSIONS = /\.pdf(\?|$)/i;
const TXT_EXTENSIONS = /\.txt(\?|$)/i;
const DOCX_EXTENSIONS = /\.docx(\?|$)/i;
const EXCEL_EXTENSIONS = /\.xlsx?(\?|$)/i;
const LEGACY_WORD_EXTENSIONS = /\.doc(\?|$)/i;

function extractFilenameFromKey(key: string): string {
  const lastPart = key.split('/').pop() || '';
  return lastPart.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, '') || lastPart;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFilename(filename: string): boolean {
  return IMAGE_EXTENSIONS.test(filename);
}

function isPdfFilename(filename: string): boolean {
  return PDF_EXTENSIONS.test(filename);
}

function isTxtFilename(filename: string): boolean {
  return TXT_EXTENSIONS.test(filename);
}

function isDocxFilename(filename: string): boolean {
  return DOCX_EXTENSIONS.test(filename);
}

function isExcelFilename(filename: string): boolean {
  return EXCEL_EXTENSIONS.test(filename);
}

function isLegacyWordFilename(filename: string): boolean {
  return LEGACY_WORD_EXTENSIONS.test(filename);
}

const REFERENCE_TYPES: { value: string; i18nKey: string }[] = [
  { value: 'link', i18nKey: 'reference_type_link' },
  { value: 'soru', i18nKey: 'reference_type_question' },
  { value: 'cevap', i18nKey: 'reference_type_answer' },
  { value: 'yorum', i18nKey: 'reference_type_comment' },
  { value: 'dosya', i18nKey: 'reference_type_file' },
];

function parseYouTubeUrl(url: string): { videoId: string; startSeconds: number } | null {
  if (!url?.trim()) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)(?:[&?]t=(\d+))?/);
  if (!m) return null;
  return { videoId: m[1], startSeconds: m[2] ? parseInt(m[2], 10) : 0 };
}

interface QuestionDetailRightPanelProps {
  question: Question;
  currentLanguage: string;
  /** Sayfada yüklü cevaplar - cevap referansları önce buradan aranır */
  answers?: Answer[];
  /** İçerikteki ref:N tıklama/hover ile vurgulanan referans index'i */
  highlightedRefIndex?: number | null;
  /** Referans kutusuna hover'da çağrılır (dosya vurgulama için) */
  onRefHover?: (refIndex: number | null) => void;
  /** Vurguyu temizlemek için (örn. referans kutusuna tıklayınca) */
  onRefHighlightClear?: () => void;
}

const QuestionDetailRightPanel: React.FC<QuestionDetailRightPanelProps> = ({
  question,
  currentLanguage,
  answers: pageAnswers = [],
  highlightedRefIndex = null,
  onRefHover,
  onRefHighlightClear,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [youtubeModal, setYoutubeModal] = useState<{ videoId: string; startSeconds: number } | null>(null);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<Record<string, string>>({});
  const [filesPage, setFilesPage] = useState(0);
  const [resolvedRefs, setResolvedRefs] = useState<Record<number, { question?: Question; answer?: Answer; comment?: CommentItem }>>({});
  const [detailPopup, setDetailPopup] = useState<{
    title: string;
    details: { key: string; value: string }[];
    description: string;
    previewUrl?: string;
    showFileIcon?: boolean;
    officeAsset?: { key: string; type?: 'question-attachment'; entityId?: string; ownerId?: string };
    linkUrl?: string;
    wide?: boolean;
    /** Soru/cevap için yeni sekmede açılacak URL */
    targetUrl?: string;
    youtubeData?: { videoId: string; startSeconds: number };
    avatarSrc?: string;
    authorName?: string;
    ownerId?: string;
    contentTitle?: string;
    contentBody?: string;
    contentBodyLabel?: string;
  } | null>(null);

  const references = useMemo(() => filledReferences(question.references), [question.references]);
  const metadata = useMemo(() => filledMetadata(question.metadata), [question.metadata]);
  const notAvailable = (labelKey: string) =>
    t('item_not_available', currentLanguage).replace('{item}', t(labelKey, currentLanguage));
  const attachments = useMemo(() => question.attachments ?? [], [question.attachments]);
  const highlightedFileKey = highlightedRefIndex != null && references[highlightedRefIndex]?.type === 'dosya'
    ? references[highlightedRefIndex].content
    : null;

  useEffect(() => {
    if (highlightedRefIndex != null) {
      setTabIndex(0);
      setTimeout(() => {
        const el = document.getElementById(`reference-${highlightedRefIndex}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [highlightedRefIndex]);

  useEffect(() => {
    if (highlightedFileKey) {
      const idx = attachments.findIndex((a) => a.key === highlightedFileKey);
      if (idx >= 0) {
        setFilesPage(Math.floor(idx / FILES_PER_PAGE));
      }
      const t = setTimeout(() => {
        const safeId = `attachment-${highlightedFileKey.replace(/[/\\]/g, '_')}`;
        const el = document.getElementById(safeId);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [highlightedFileKey, attachments]);

  useEffect(() => {
    const soruCevapRefs = references
      .map((ref, idx) => ({ ref, idx }))
      .filter(({ ref }) => ref.type === 'soru' || ref.type === 'cevap' || ref.type === 'yorum');
    if (soruCevapRefs.length === 0) return;
    let cancelled = false;
    const load = async () => {
      const next: Record<number, { question?: Question; answer?: Answer; comment?: CommentItem }> = {};
      for (const { ref, idx } of soruCevapRefs) {
        if (!ref.content?.trim()) continue;
        try {
          if (ref.type === 'soru') {
            const q = await questionService.getQuestionById(ref.content.trim());
            if (!cancelled && q) next[idx] = { question: q };
          } else if (ref.type === 'cevap') {
            const raw = ref.content.trim();
            const answerId = raw.includes('/') ? raw.split('/').pop()?.trim() || raw : raw;
            let a: Answer | null = pageAnswers.find((ans) => ans.id === answerId) ?? null;
            if (!a) {
              a = await answerService.getAnswerById(answerId);
            }
            if (!a && question.id) {
              a = await answerService.getAnswerByQuestionAndId(question.id, answerId);
            }
            if (!cancelled && a) next[idx] = { answer: a };
          } else if (ref.type === 'yorum') {
            const comment = await commentService.getById(ref.content.trim());
            if (!cancelled && comment) next[idx] = { comment };
          }
        } catch {
          // ignore
        }
      }
      if (!cancelled) setResolvedRefs((prev) => ({ ...prev, ...next }));
    };
    load();
    return () => { cancelled = true; };
  }, [references, question.id, pageAnswers]);

  useEffect(() => {
    if (attachments.length === 0) return;
    let cancelled = false;
    const loadUrls = async () => {
      const previewUrls: Record<string, string> = {};
      for (const att of attachments) {
        try {
          const previewUrl = await contentAssetService.resolveAssetUrl({
            key: att.key,
            type: 'question-attachment',
            entityId: question.id,
            ownerId: question.author?.id,
            download: false,
          });
          if (!cancelled) previewUrls[att.key] = previewUrl;
        } catch {
          // ignore
        }
      }
      if (!cancelled) {
        setAttachmentPreviewUrls((prev) => ({ ...prev, ...previewUrls }));
      }
    };
    loadUrls();
    return () => { cancelled = true; };
  }, [question.id, question.author?.id, attachments]);

  const handleDownload = async (att: { key: string }) => {
    try {
      const blob = await contentAssetService.downloadAsset({
        key: att.key,
        type: 'question-attachment',
        entityId: question.id,
        ownerId: question.author?.id,
        filename: extractFilenameFromKey(att.key),
      });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = extractFilenameFromKey(att.key) || 'dosya';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      showErrorToast(t('download_failed', currentLanguage));
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < attachments.length; i++) {
      await handleDownload(attachments[i]);
      if (i < attachments.length - 1) await new Promise((r) => setTimeout(r, 300));
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', height: '100%', minHeight: 0 }}>
      {/* Referanslar + Metadata paneli */}
      <Box
        sx={(theme) => ({
          flex: 1,
          minHeight: 0,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
              : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          boxShadow: theme.shadows[8],
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        })}
      >
        <Box sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth" sx={{ minHeight: 48 }}>
            <Tab label={t('references', currentLanguage)} sx={{ typography: 'body1' }} />
            <Tab label={t('metadata', currentLanguage)} sx={{ typography: 'body1' }} />
          </Tabs>
        </Box>
        <Box sx={(theme) => ({ flex: 1, minHeight: 0, overflow: 'auto', p: 3, pt: 4, ...getScrollbarSx(theme) })}>
          {tabIndex === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, overflow: 'visible' }}>
              {references.length === 0 ? (
                <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary }}>
                  {notAvailable('references')}
                </Typography>
              ) : (
                references.map((ref, idx) => {
                  const resolved = resolvedRefs[idx];
                  const isSoruWithData = ref.type === 'soru' && resolved?.question;
                  const isCevapWithData = ref.type === 'cevap' && resolved?.answer;
                  const isYorumWithData = ref.type === 'yorum' && resolved?.comment;
                  const isCevapClickable = ref.type === 'cevap' && !!ref.content?.trim();
                  const isYorumClickable = ref.type === 'yorum' && !!ref.content?.trim();
                  const isHighlighted = highlightedRefIndex === idx;

                  const getSoruCevapTargetUrl = (): string | undefined => {
                    if (isSoruWithData && resolved?.question) {
                      return `${window.location.origin}/questions/${resolved.question.id}`;
                    }
                    if (isCevapWithData && resolved?.answer) {
                      const qId = resolved.answer.questionId ?? (pageAnswers.some((pa) => pa.id === resolved?.answer?.id) ? question.id : null);
                      return qId ? `${window.location.origin}/questions/${qId}#answer-${resolved.answer!.id}` : undefined;
                    }
                    if (isYorumWithData && resolved?.comment?.questionId) {
                      return `${window.location.origin}/questions/${resolved.comment.questionId}#comment-${resolved.comment.id}`;
                    }
                    return undefined;
                  };

                  const handleRefClick = async (e?: React.MouseEvent) => {
                    const hasPopupContent = ref.description?.trim() || ref.type === 'link' || ref.type === 'dosya' || isSoruWithData || isCevapWithData || isYorumWithData;
                    if (hasPopupContent) {
                      if (isSoruWithData || isCevapWithData || isYorumWithData) {
                        const q = resolved?.question;
                        const a = resolved?.answer;
                        const comment = resolved?.comment;
                        const authorName = q?.author?.name ?? a?.author?.name ?? comment?.authorName ?? q?.userInfo?.name ?? a?.userInfo?.name ?? '—';
                        const avatarSrc = q?.userInfo?.profile_image || q?.author?.avatar || a?.userInfo?.profile_image || a?.author?.avatar || comment?.authorAvatar || undefined;
                        const ownerId = q?.userInfo?._id ?? q?.author?.id ?? a?.userInfo?._id ?? a?.author?.id ?? comment?.userId ?? undefined;
                        const contentTitle = q?.summary ?? a?.questionSummary ?? (comment?.body ? comment.body.slice(0, 80) : '—');
                        const contentBody = q?.detail ?? a?.content ?? comment?.body ?? '';
                        const contentBodyLabel = ref.type === 'soru'
                          ? (t('question_detail', currentLanguage) || 'Soru detayı')
                          : ref.type === 'yorum'
                            ? t('reference_type_comment', currentLanguage)
                            : (t('answer', currentLanguage) || 'Cevap');
                        setDetailPopup({
                          title: `${t(REFERENCE_TYPES.find((r) => r.value === ref.type)?.i18nKey ?? 'ref', currentLanguage)} #${idx + 1}`,
                          details: [],
                          description: ref.description || '',
                          showFileIcon: false,
                          targetUrl: getSoruCevapTargetUrl(),
                          avatarSrc,
                          authorName,
                          ownerId,
                          contentTitle,
                          contentBody,
                          contentBodyLabel,
                        });
                      } else if (ref.type === 'link') {
                        const url = ref.content?.trim();
                        const yt = url ? parseYouTubeUrl(url) : null;
                        const isUrl = url && (url.startsWith('http://') || url.startsWith('https://'));
                        setDetailPopup({ title: `${t('reference_type_link', currentLanguage)} #${idx + 1}`, details: [{ key: t('reference_content', currentLanguage) || 'URL', value: ref.content || '' }], description: ref.description || '', linkUrl: isUrl ? url : undefined, youtubeData: yt ?? undefined, wide: true });
                      } else if (ref.type === 'dosya') {
                        const fn = extractFilenameFromKey(ref.content) || ref.content;
                        const fileKey = ref.content;
                        const preview = fileKey && attachments.find((a) => a.key === fileKey) ? attachmentPreviewUrls[fileKey] : undefined;
                        setDetailPopup({
                          title: `${t('reference_type_file', currentLanguage)}: ${fn}`,
                          details: [{ key: t('reference_content', currentLanguage) || 'İçerik', value: fn }],
                          description: ref.description || '',
                          previewUrl: preview,
                          showFileIcon: true,
                          officeAsset: fileKey
                            ? {
                                key: fileKey,
                                type: 'question-attachment',
                                entityId: question.id,
                                ownerId: question.author?.id,
                              }
                            : undefined,
                        });
                      } else {
                        const missingKey = ref.type === 'soru'
                          ? 'reference_type_question'
                          : ref.type === 'yorum'
                            ? 'reference_type_comment'
                            : 'reference_type_answer';
                        setDetailPopup({ title: `${t(missingKey, currentLanguage)} #${idx + 1}`, details: [{ key: t('reference_content', currentLanguage) || 'İçerik', value: ref.content || '—' }], description: ref.description || '', showFileIcon: false });
                      }
                      return;
                    }
                    if (ref.type === 'cevap' && ref.content?.trim()) {
                      const raw = ref.content.trim();
                      const answerId = raw.includes('/') ? raw.split('/').pop()?.trim() || raw : raw;
                      try {
                        const a = await answerService.getAnswerById(answerId) ?? (question.id ? await answerService.getAnswerByQuestionAndId(question.id, answerId) : null);
                        if (a) {
                          setResolvedRefs((prev) => ({ ...prev, [idx]: { answer: a } }));
                          const qId = a.questionId ?? (pageAnswers.some((pa) => pa.id === a.id) ? question.id : null);
                          if (qId) {
                            const authorName = a.author?.name ?? a.userInfo?.name ?? '—';
                            const avatarSrc = a.userInfo?.profile_image || a.author?.avatar || undefined;
                            const ownerId = a.userInfo?._id ?? a.author?.id ?? undefined;
                            setDetailPopup({
                              title: `${t('reference_type_answer', currentLanguage)} #${idx + 1}`,
                              details: [],
                              description: ref.description || '',
                              showFileIcon: false,
                              targetUrl: `${window.location.origin}/questions/${qId}#answer-${a.id}`,
                              avatarSrc,
                              authorName,
                              ownerId,
                              contentTitle: a.questionSummary ?? '—',
                              contentBody: a.content ?? '',
                              contentBodyLabel: t('answer', currentLanguage) || 'Cevap',
                            });
                          } else {
                            showErrorToast(t('reference_answer_not_found', currentLanguage));
                          }
                        } else {
                          showErrorToast(t('reference_answer_not_found', currentLanguage));
                        }
                      } catch {
                        showErrorToast(t('reference_load_failed', currentLanguage));
                      }
                    } else if (ref.type === 'yorum' && ref.content?.trim()) {
                      try {
                        const comment = await commentService.getById(ref.content.trim());
                        if (comment?.questionId) {
                          setResolvedRefs((prev) => ({ ...prev, [idx]: { comment } }));
                          setDetailPopup({
                            title: `${t('reference_type_comment', currentLanguage)} #${idx + 1}`,
                            details: [],
                            description: ref.description || '',
                            showFileIcon: false,
                            targetUrl: `${window.location.origin}/questions/${comment.questionId}#comment-${comment.id}`,
                            avatarSrc: comment.authorAvatar,
                            authorName: comment.authorName || '—',
                            ownerId: comment.userId,
                            contentTitle: comment.body?.slice(0, 80) || '—',
                            contentBody: comment.body || '',
                            contentBodyLabel: t('reference_type_comment', currentLanguage),
                          });
                        } else {
                          showErrorToast(t('reference_comment_not_found', currentLanguage));
                        }
                      } catch {
                        showErrorToast(t('reference_load_failed', currentLanguage));
                      }
                    } else if (isHighlighted) {
                      onRefHighlightClear?.();
                    }
                  };

                  return (
                  <Box
                    key={idx}
                    id={`reference-${idx}`}
                    onMouseEnter={() => onRefHover?.(idx)}
                    onMouseLeave={() => onRefHover?.(null)}
                    onClick={handleRefClick}
                    sx={(theme) => ({
                      position: 'relative',
                      overflow: 'visible',
                      p: 1.5,
                      borderRadius: 1,
                      border: `1px solid ${isHighlighted ? theme.palette.primary.main : theme.palette.divider}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      backgroundColor: isHighlighted
                        ? (theme.palette.mode === 'dark'
                            ? `${theme.palette.primary.main}22`
                            : `${theme.palette.primary.main}15`)
                        : 'transparent',
                      cursor: (isSoruWithData || isCevapWithData || isYorumWithData || isCevapClickable || isYorumClickable || isHighlighted || ref.description?.trim() || ref.type === 'link' || ref.type === 'dosya') ? 'pointer' : 'default',
                      transition: 'border-color 0.2s, background-color 0.2s',
                      '&:hover': (isSoruWithData || isCevapWithData || isYorumWithData || isCevapClickable || isYorumClickable || ref.description?.trim() || ref.type === 'link' || ref.type === 'dosya')
                        ? {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: theme.palette.mode === 'dark'
                              ? `${theme.palette.primary.main}22`
                              : `${theme.palette.primary.main}0a`,
                          }
                        : {},
                    })}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: -6,
                        left: -6,
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: (t) => t.palette.action.selected,
                        color: (t) => t.palette.text.secondary,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        boxShadow: (t) => `0 0 0 1px ${t.palette.divider}`,
                      }}
                    >
                      {idx + 1}
                    </Typography>
                    <Typography variant="caption" sx={{ color: (t) => t.palette.text.secondary }}>
                      {REFERENCE_TYPES.find((r) => r.value === ref.type)?.i18nKey
                        ? t(REFERENCE_TYPES.find((r) => r.value === ref.type)!.i18nKey, currentLanguage)
                        : ref.type}
                    </Typography>
                    {(isSoruWithData || isCevapWithData || isYorumWithData) ? (() => {
                      const q = resolved?.question;
                      const a = resolved?.answer;
                      const comment = resolved?.comment;
                      const authorName = q?.author?.name ?? a?.author?.name ?? comment?.authorName ?? q?.userInfo?.name ?? a?.userInfo?.name ?? '—';
                      const avatarSrc = q?.userInfo?.profile_image || q?.author?.avatar || a?.userInfo?.profile_image || a?.author?.avatar || comment?.authorAvatar || undefined;
                      const ownerId = q?.userInfo?._id ?? q?.author?.id ?? a?.userInfo?._id ?? a?.author?.id ?? comment?.userId ?? undefined;
                      const title = q?.summary ?? a?.questionSummary ?? (comment?.body ? comment.body.slice(0, 80) : '—');
                      const rawContent = comment ? '' : (q?.detail ?? a?.content ?? '');
                      const contentDisplay = stripRefLinksForDisplay(rawContent);
                      const contentPreview = contentDisplay?.slice(0, PREVIEW_LENGTH);
                      const contentSuffix = contentDisplay?.length > PREVIEW_LENGTH ? '...' : '';
                      const handleAuthorClick = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (ownerId) window.open(`${window.location.origin}/profile/${ownerId}`, '_blank', 'noopener,noreferrer');
                      };
                      const targetUrl = getSoruCevapTargetUrl();
                      return (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            component="button"
                            type="button"
                            onClick={handleAuthorClick}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              border: 'none',
                              background: 'none',
                              padding: 0,
                              cursor: ownerId ? 'pointer' : 'default',
                              '&:hover': ownerId ? { opacity: 0.85 } : {},
                            }}
                          >
                            <ProfileAvatar
                              src={avatarSrc || undefined}
                              ownerId={ownerId}
                              fallbackName={authorName}
                              sx={{ width: 36, height: 36, flexShrink: 0 }}
                            />
                            <Typography variant="caption" sx={{ color: (t) => t.palette.text.secondary, display: 'block' }}>
                              {authorName}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: (t) => t.palette.text.primary, mb: 0.25 }}>
                              {title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: (t) => t.palette.text.secondary, display: 'block' }}>
                              {contentPreview}{contentSuffix}
                            </Typography>
                          </Box>
                          {targetUrl && (
                            <Tooltip title={t('open_in_new', currentLanguage)}>
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); window.open(targetUrl, '_blank', 'noopener,noreferrer'); }}
                                sx={{ flexShrink: 0 }}
                              >
                                <OpenInNew sx={{ fontSize: 20 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                        {ref.description?.trim() && (
                          <Box sx={{ display: 'block', mt: 0.5 }}>
                            <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary }}>
                              <Box component="span" sx={{ fontWeight: 700 }}>{t('reference_description', currentLanguage)}: </Box>
                              {truncateDescription(ref.description)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      );
                    })() : ref.type === 'link' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ flex: 1, minWidth: 0, color: (t) => t.palette.text.primary, wordBreak: 'break-all' }}>
                          {ref.content}
                        </Typography>
                        {(() => {
                          const yt = parseYouTubeUrl(ref.content);
                          const url = ref.content?.trim();
                          const isUrl = url && (url.startsWith('http://') || url.startsWith('https://'));
                          if (yt) {
                            return (
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); setYoutubeModal(yt); }}
                                sx={{ flexShrink: 0, color: '#FF0000' }}
                              >
                                <YouTube sx={{ fontSize: 24 }} />
                              </IconButton>
                            );
                          }
                          if (isUrl) {
                            return (
                              <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); window.open(url, '_blank', 'noopener,noreferrer'); }}
                                sx={{ flexShrink: 0 }}
                              >
                                <OpenInNew sx={{ fontSize: 20 }} />
                              </IconButton>
                            );
                          }
                          return null;
                        })()}
                      </Box>
                    ) : ref.type === 'dosya' ? (
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: (t) => t.palette.text.primary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                          }}
                        >
                          {extractFilenameFromKey(ref.content) || ref.content}
                        </Typography>
                        {ref.description?.trim() && (
                          <Box sx={{ display: 'block', mt: 0.5 }}>
                            <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary }}>
                              <Box component="span" sx={{ fontWeight: 700 }}>{t('reference_description', currentLanguage)}: </Box>
                              {truncateDescription(ref.description)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : ref.type === 'cevap' || ref.type === 'yorum' ? (
                      <Box>
                        {ref.description?.trim() ? (
                          <Box>
                            <Typography variant="body2" sx={{ color: (t) => t.palette.text.primary }}>
                              <Box component="span" sx={{ fontWeight: 700 }}>{t('reference_description', currentLanguage)}: </Box>
                              {truncateDescription(ref.description)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary, wordBreak: 'break-all' }}>
                            {ref.content || '—'}
                          </Typography>
                        )}
                      </Box>
                    ) : ref.type === 'soru' ? (
                      <Box>
                        {ref.description?.trim() ? (
                          <Box>
                            <Typography variant="body2" sx={{ color: (t) => t.palette.text.primary }}>
                              <Box component="span" sx={{ fontWeight: 700 }}>{t('reference_description', currentLanguage)}: </Box>
                              {truncateDescription(ref.description)}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary, wordBreak: 'break-all' }}>
                            {ref.content || '—'}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: (t) => t.palette.text.primary, wordBreak: 'break-all' }}>
                        {ref.content}
                      </Typography>
                    )}
                    {ref.description?.trim() && ref.type !== 'cevap' && ref.type !== 'soru' && ref.type !== 'yorum' && ref.type !== 'dosya' && (
                      <Box>
                        <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary }}>
                          <Box component="span" sx={{ fontWeight: 700 }}>{t('reference_description', currentLanguage)}: </Box>
                          {truncateDescription(ref.description)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  );
                })
              )}
            </Box>
          )}
          {tabIndex === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {metadata.length === 0 ? (
                <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary }}>
                  {notAvailable('metadata')}
                </Typography>
              ) : (
                metadata.map((m, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: 1,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: (t) => t.palette.text.secondary, minWidth: 80 }}>
                      {m.key}:
                    </Typography>
                    <Typography variant="body2" sx={{ color: (t) => t.palette.text.primary, flex: 1 }}>
                      {m.value}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Dosyalar adacığı - oluşturmadaki ile birebir aynı görünüm */}
      <Box
        sx={(theme) => ({
          flex: '0 1 320px',
          minWidth: 280,
          minHeight: 160,
          maxHeight: 320,
          p: 2,
          borderRadius: 2,
          border: `2px dashed ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[6],
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          transition: 'border-color 0.2s, background-color 0.2s',
          overflow: 'auto',
          ...getScrollbarSx(theme),
        })}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, color: (theme) => theme.palette.text.secondary }}>
            {t('file_upload_title', currentLanguage)}
          </Typography>
          {attachments.length > 0 && (
            <Tooltip title={t('file_download_all', currentLanguage)}>
              <IconButton size="small" onClick={handleDownloadAll} sx={{ p: 0.25 }}>
                <Download sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: attachments.length === 0 ? '1fr' : attachments.length <= 2 ? '1fr 1fr' : '1fr 1fr auto',
            gap: 1.5,
            minHeight: 220,
            maxHeight: attachments.length >= FILES_PER_PAGE ? 320 : 220,
            overflow: 'visible',
          }}
        >
          {(() => {
            const pageFiles = attachments.slice(filesPage * FILES_PER_PAGE, (filesPage + 1) * FILES_PER_PAGE);
            if (attachments.length === 0) {
              return (
                <Box
                  sx={{
                    gridColumn: '1 / -1',
                    gridRow: '1 / -1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: (theme) => theme.palette.text.secondary,
                  }}
                >
                  <InsertDriveFile sx={{ fontSize: 36, opacity: 0.5 }} />
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {notAvailable('file_upload_title')}
                  </Typography>
                </Box>
              );
            }
            return (
              <>
                {pageFiles.map((att, idx) => {
                  const isFileHighlighted = highlightedFileKey === att.key;
                  const fileNum = filesPage * FILES_PER_PAGE + idx + 1;
                  return (
                  <Box
                    key={att.key}
                    id={`attachment-${att.key.replace(/[/\\]/g, '_')}`}
                    onClick={() => {
                      const details: { key: string; value: string }[] = [{ key: t('reference_content', currentLanguage) || 'Dosya', value: extractFilenameFromKey(att.key) || att.key }];
                      if (att.size != null) details.push({ key: t('file_size', currentLanguage) || 'Boyut', value: formatFileSize(att.size) });
                      const preview = attachmentPreviewUrls[att.key];
                      setDetailPopup({
                        title: extractFilenameFromKey(att.key) || 'Dosya',
                        details,
                        description: att.description || '',
                        previewUrl: preview,
                        showFileIcon: true,
                        officeAsset: {
                          key: att.key,
                          type: 'question-attachment',
                          entityId: question.id,
                          ownerId: question.author?.id,
                        },
                      });
                    }}
                    sx={(theme) => ({
                      position: 'relative',
                      overflow: 'visible',
                      p: 1,
                      pl: 2.5,
                      borderRadius: 1,
                      border: `1px solid ${isFileHighlighted ? theme.palette.primary.main : theme.palette.divider}`,
                      backgroundColor: isFileHighlighted
                        ? (theme.palette.mode === 'dark' ? `${theme.palette.primary.main}22` : `${theme.palette.primary.main}15`)
                        : theme.palette.background.default,
                      display: 'grid',
                      gridTemplateColumns: '48px 1fr',
                      gridTemplateRows: 'auto auto',
                      gap: '4px 8px',
                      minWidth: 0,
                      transition: 'border-color 0.2s, background-color 0.2s',
                      cursor: 'pointer',
                    })}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: -6,
                        left: -6,
                        width: 18,
                        height: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        backgroundColor: (t) => t.palette.action.selected,
                        color: (t) => t.palette.text.secondary,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        boxShadow: (t) => `0 0 0 1px ${t.palette.divider}`,
                      }}
                    >
                      {fileNum}
                    </Typography>
                    <Box
                      sx={(theme) => ({
                        width: 48,
                        height: 48,
                        borderRadius: 0.5,
                        overflow: 'hidden',
                        position: 'relative',
                        backgroundColor: theme.palette.action.hover,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gridColumn: 1,
                        gridRow: 1,
                      })}
                    >
                      {(() => {
                        const fname = extractFilenameFromKey(att.key);
                        if (isPdfFilename(fname)) {
                          return <PictureAsPdf sx={{ fontSize: 28, color: (theme) => theme.palette.error.main }} />;
                        }
                        if (isDocxFilename(fname) || isLegacyWordFilename(fname)) {
                          return <Article sx={{ fontSize: 28, color: (theme) => theme.palette.info.main }} />;
                        }
                        if (isExcelFilename(fname)) {
                          return <TableChart sx={{ fontSize: 28, color: (theme) => theme.palette.success.main }} />;
                        }
                        if (isTxtFilename(fname)) {
                          return <Description sx={{ fontSize: 28, color: (theme) => theme.palette.text.disabled }} />;
                        }
                        return <InsertDriveFile sx={{ fontSize: 28, color: (theme) => theme.palette.text.disabled }} />;
                      })()}
                      {attachmentPreviewUrls[att.key] && isImageFilename(extractFilenameFromKey(att.key)) && (
                        <img
                          src={attachmentPreviewUrls[att.key]}
                          alt=""
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ gridColumn: 2, gridRow: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5, minHeight: 36, minWidth: 0 }}>
                      <Tooltip title={extractFilenameFromKey(att.key) || 'Dosya'} placement="top" enterDelay={300}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 500,
                            flex: 1,
                            minWidth: 0,
                            maxWidth: '100%',
                            minHeight: 36,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            color: (theme) => theme.palette.text.primary,
                          }}
                        >
                          {extractFilenameFromKey(att.key) || 'Dosya'}
                        </Typography>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleDownload(att); }}
                        sx={{ p: 0.25, flexShrink: 0 }}
                      >
                        <Download sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary, fontSize: '0.75rem', gridColumn: 1, gridRow: 2, alignSelf: 'center' }}>
                      {att.size != null ? formatFileSize(att.size) : '—'}
                    </Typography>
                    <Box sx={{ gridColumn: 2, gridRow: 2, alignSelf: 'center' }}>
                      <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary, fontSize: '0.75rem' }}>
                        {truncateDescription(att.description) || '—'}
                      </Typography>
                    </Box>
                  </Box>
                  );
                })}
              </>
            );
          })()}
        </Box>
        {attachments.length > FILES_PER_PAGE && (
          <Pagination
            count={Math.ceil(attachments.length / FILES_PER_PAGE)}
            page={filesPage + 1}
            onChange={(_, page) => setFilesPage(page - 1)}
            size="small"
            color="primary"
            sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}
          />
        )}
      </Box>
      <ItemDetailPopup
        open={!!detailPopup}
        onClose={() => setDetailPopup(null)}
        title={detailPopup?.title ?? ''}
        details={detailPopup?.details ?? []}
        description={detailPopup?.description ?? ''}
        currentLanguage={currentLanguage}
        descriptionLabel={t('reference_description', currentLanguage)}
        previewUrl={detailPopup?.previewUrl}
        showFileIcon={detailPopup?.showFileIcon}
        officeAsset={detailPopup?.officeAsset}
        linkUrl={detailPopup?.linkUrl}
        wide={detailPopup?.wide}
        targetUrl={detailPopup?.targetUrl}
        youtubeData={detailPopup?.youtubeData}
        linkOpenLabel={t('reference_open_link', currentLanguage)}
        targetOpenLabel={t('open_in_new', currentLanguage)}
        youtubePreviewLabel={t('reference_play_video', currentLanguage)}
        onYoutubePreview={(data) => { setYoutubeModal(data); setDetailPopup(null); }}
        avatarSrc={detailPopup?.avatarSrc}
        authorName={detailPopup?.authorName}
        ownerId={detailPopup?.ownerId}
        contentTitle={detailPopup?.contentTitle}
        contentBody={detailPopup?.contentBody}
        contentBodyLabel={detailPopup?.contentBodyLabel}
      />
      <Dialog
        open={!!youtubeModal}
        onClose={() => setYoutubeModal(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: (theme) => theme.palette.background.paper,
            borderRadius: 2,
          },
        }}
      >
        <DialogContent sx={{ p: 2 }}>
          {youtubeModal && (
            <Box
              sx={{
                position: 'relative',
                paddingTop: '56.25%',
                borderRadius: 1,
                overflow: 'hidden',
                backgroundColor: '#000',
              }}
            >
              <iframe
                title="YouTube video"
                src={`https://www.youtube.com/embed/${youtubeModal.videoId}?start=${youtubeModal.startSeconds}&autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default QuestionDetailRightPanel;
