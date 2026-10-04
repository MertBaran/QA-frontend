import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Dialog, DialogContent, IconButton, Typography } from '@mui/material';
import { Article, Description, Download, InsertDriveFile, PictureAsPdf, TableChart, YouTube } from '@mui/icons-material';
import { t } from '../../utils/translations';
import { contentAssetService } from '../../services/contentAssetService';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import { commentService } from '../../services/commentService';
import { filledMetadata, filledReferences } from '../../utils/filledEntries';
import ProfileAvatar from '../ui/ProfileAvatar';
import ItemDetailPopup from '../ui/ItemDetailPopup';
import type { OfficeAssetRef } from '../../utils/officePreview';
import type { Question, QuestionAttachment, QuestionMetadataItem, QuestionReference } from '../../types/question';
import type { Answer } from '../../types/answer';
import type { CommentItem } from '../../types/comment';

const TYPE_KEYS: Record<string, string> = {
  link: 'reference_type_link',
  soru: 'reference_type_question',
  cevap: 'reference_type_answer',
  yorum: 'reference_type_comment',
  dosya: 'reference_type_file',
};

function parseYouTubeUrl(url: string): { videoId: string; startSeconds: number } | null {
  if (!url?.trim()) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)(?:[&?]t=(\d+))?/);
  if (!match) return null;
  return { videoId: match[1], startSeconds: match[2] ? parseInt(match[2], 10) : 0 };
}

type DetailPopupState = {
  title: string;
  details?: { key: string; value: string }[];
  description?: string;
  previewUrl?: string;
  showFileIcon?: boolean;
  officeAsset?: OfficeAssetRef;
  linkUrl?: string;
  wide?: boolean;
  youtubeData?: { videoId: string; startSeconds: number };
};

function fileName(key: string): string {
  const last = key.split('/').pop() || key;
  return last.replace(/^[0-9a-f-]{36}-/i, '') || last;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileGlyph({ name }: { name: string }) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return <PictureAsPdf sx={{ fontSize: 28, color: 'error.main' }} />;
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return <Article sx={{ fontSize: 28, color: 'info.main' }} />;
  if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return <TableChart sx={{ fontSize: 28, color: 'success.main' }} />;
  if (lower.endsWith('.txt')) return <Description sx={{ fontSize: 28, color: 'text.disabled' }} />;
  return <InsertDriveFile sx={{ fontSize: 28, color: 'text.disabled' }} />;
}

const NO_REFERENCES: QuestionReference[] = [];
const NO_METADATA: QuestionMetadataItem[] = [];

interface AnswerReferenceListProps {
  answerId: string;
  ownerId?: string;
  references?: QuestionReference[];
  metadata?: QuestionMetadataItem[];
  attachments?: QuestionAttachment[];
  currentLanguage: string;
  highlightedRefIndex?: number | null;
  onRefHover?: (refIndex: number | null) => void;
}

const AnswerReferenceList: React.FC<AnswerReferenceListProps> = ({
  answerId,
  ownerId,
  references = NO_REFERENCES,
  metadata = NO_METADATA,
  attachments = [],
  currentLanguage,
  highlightedRefIndex = null,
  onRefHover,
}) => {
  const navigate = useNavigate();
  const visibleReferences = filledReferences(references);
  const visibleMetadata = filledMetadata(metadata);
  const [resolved, setResolved] = useState<Record<number, { question?: Question; answer?: Answer; comment?: CommentItem }>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [detailPopup, setDetailPopup] = useState<DetailPopupState | null>(null);
  const [youtubeModal, setYoutubeModal] = useState<{ videoId: string; startSeconds: number } | null>(null);

  useEffect(() => {
    if (highlightedRefIndex == null) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`answer-reference-${answerId}-${highlightedRefIndex}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, 50);
    return () => window.clearTimeout(timer);
  }, [highlightedRefIndex, answerId]);

  useEffect(() => {
    const targets = filledReferences(references)
      .map((ref, index) => ({ ref, index }))
      .filter(({ ref }) => ref.type === 'soru' || ref.type === 'cevap' || ref.type === 'yorum');
    if (targets.length === 0) {
      setResolved({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      const next: Record<number, { question?: Question; answer?: Answer; comment?: CommentItem }> = {};
      for (const { ref, index } of targets) {
        try {
          if (ref.type === 'soru') {
            const question = await questionService.getQuestionById(ref.content.trim());
            if (question) next[index] = { question };
          } else if (ref.type === 'yorum') {
            const comment = await commentService.getById(ref.content.trim());
            if (comment) next[index] = { comment };
          } else {
            const raw = ref.content.trim();
            const id = raw.includes('/') ? raw.split('/').pop()?.trim() || raw : raw;
            const answer = await answerService.getAnswerById(id);
            if (answer) next[index] = { answer };
          }
        } catch {
          // Çözülemeyen referans kimliğiyle kalır.
        }
      }
      if (!cancelled) setResolved(next);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [references]);

  const missing = (key: string) =>
    t('item_not_available', currentLanguage).replace('{item}', t(key, currentLanguage));

  const openInPlace = (event: React.MouseEvent, path: string) => {
    event.stopPropagation();
    if (event.ctrlKey || event.metaKey || event.button === 1) {
      window.open(path, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(path);
  };

  const officeAsset = (key: string): OfficeAssetRef => ({
    key,
    type: 'answer-attachment',
    entityId: answerId,
    ownerId,
  });

  const resolvePreview = async (key: string) => {
    if (previewUrls[key]) return previewUrls[key];
    const url = await contentAssetService.resolveAssetUrl({
      key,
      type: 'answer-attachment',
      entityId: answerId,
      ownerId,
      download: false,
    });
    setPreviewUrls(current => ({ ...current, [key]: url }));
    return url;
  };

  const openLink = (url: string, description: string) => {
    const trimmed = url.trim();
    const youtube = parseYouTubeUrl(trimmed);
    const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    setDetailPopup({
      title: t('reference_type_link', currentLanguage),
      details: [{ key: 'URL', value: trimmed }],
      description,
      linkUrl: isUrl ? trimmed : undefined,
      youtubeData: youtube ?? undefined,
      wide: true,
    });
  };

  const openFile = async (key: string, description: string) => {
    const name = fileName(key);
    const size = attachments.find(file => file.key === key)?.size;
    let previewUrl: string | undefined;
    try {
      previewUrl = await resolvePreview(key);
    } catch {
      previewUrl = undefined;
    }
    setDetailPopup({
      title: name,
      details: size != null ? [{ key: t('file_size', currentLanguage), value: formatFileSize(size) }] : [],
      description,
      previewUrl,
      showFileIcon: true,
      officeAsset: officeAsset(key),
    });
  };

  const download = async (key: string) => {
    const blob = await contentAssetService.downloadAsset({
      key,
      type: 'answer-attachment',
      entityId: answerId,
      ownerId,
      filename: fileName(key),
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName(key);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('references', currentLanguage)}
        </Typography>
        {visibleReferences.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {missing('references')}
          </Typography>
        ) : (
          visibleReferences.map((ref, index) => {
            const match = resolved[index];
            const question = match?.question;
            const answer = match?.answer;
            const comment = match?.comment;
            const authorId = question?.userInfo?._id || question?.author?.id || answer?.userInfo?._id || answer?.author?.id || comment?.userId;
            const authorName = question?.author?.name || question?.userInfo?.name || answer?.author?.name || answer?.userInfo?.name || comment?.authorName || '';
            const avatar = question?.userInfo?.profile_image || question?.author?.avatar || answer?.userInfo?.profile_image || answer?.author?.avatar || comment?.authorAvatar;
            const value = question?.summary || answer?.questionSummary || comment?.body || (ref.type === 'dosya' ? fileName(ref.content) : ref.content);
            const targetPath = question
              ? `/questions/${question.id}`
              : answer?.questionId
                ? `/questions/${answer.questionId}#answer-${answer.id}`
                : comment?.questionId
                  ? `/questions/${comment.questionId}#comment-${comment.id}`
                  : undefined;
            const isEntity = ref.type === 'soru' || ref.type === 'cevap' || ref.type === 'yorum';
            const fileSize = attachments.find(file => file.key === ref.content)?.size;
            const youtube = ref.type === 'link' ? parseYouTubeUrl(ref.content) : null;
            const openCard = ref.type === 'link'
              ? (event: React.MouseEvent) => {
                  event.stopPropagation();
                  openLink(ref.content, ref.description || '');
                }
              : ref.type === 'dosya'
                ? (event: React.MouseEvent) => {
                    event.stopPropagation();
                    void openFile(ref.content, ref.description || '');
                  }
                : targetPath
                  ? (event: React.MouseEvent) => openInPlace(event, targetPath)
                  : undefined;
            const isHighlighted = highlightedRefIndex === index;
            return (
              <Box
                key={`${ref.type}-${index}`}
                id={`answer-reference-${answerId}-${index}`}
                onMouseEnter={() => onRefHover?.(index)}
                onMouseLeave={() => onRefHover?.(null)}
                onClick={openCard}
                onAuxClick={targetPath && ref.type !== 'link' && ref.type !== 'dosya' ? event => openInPlace(event, targetPath) : undefined}
                sx={theme => ({
                  mt: 0.75,
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: isHighlighted ? 'primary.main' : 'divider',
                  backgroundColor: isHighlighted
                    ? (theme.palette.mode === 'dark' ? `${theme.palette.primary.main}22` : `${theme.palette.primary.main}15`)
                    : 'transparent',
                  cursor: openCard ? 'pointer' : 'default',
                  transition: 'border-color 0.2s, background-color 0.2s',
                  '&:hover': openCard ? { borderColor: 'primary.main' } : {},
                })}
              >
                <Typography variant="caption" color="text.secondary">
                  {t(TYPE_KEYS[ref.type] || ref.type, currentLanguage)}
                </Typography>
                {isEntity && authorId && (
                  <Box
                    component="button"
                    type="button"
                    onClick={event => openInPlace(event, `/profile/${authorId}`)}
                    onAuxClick={event => openInPlace(event, `/profile/${authorId}`)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      mt: 0.5,
                      p: 0,
                      border: 0,
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      color: 'text.primary',
                      '& .MuiAvatar-root': {
                        border: theme => `2px solid ${theme.palette.primary.main}33`,
                        transition: 'border-color 0.2s ease, transform 0.2s ease',
                      },
                      '&:hover .MuiAvatar-root': {
                        borderColor: 'primary.main',
                        transform: 'scale(1.05)',
                      },
                      '&:hover .MuiTypography-root': {
                        color: 'primary.main',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    <ProfileAvatar
                      src={avatar}
                      ownerId={authorId}
                      fallbackName={authorName}
                      sx={{ width: 28, height: 28, fontSize: 13 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600 }}
                    >
                      {authorName}
                    </Typography>
                  </Box>
                )}
                {ref.type === 'link' ? (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', flex: 1 }}>
                      {ref.content}
                    </Typography>
                    {youtube && (
                      <IconButton
                        size="small"
                        aria-label={t('reference_play_video', currentLanguage)}
                        onClick={event => {
                          event.stopPropagation();
                          setYoutubeModal(youtube);
                        }}
                        sx={{ color: '#FF0000', flexShrink: 0 }}
                      >
                        <YouTube fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ) : ref.type === 'dosya' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <FileGlyph name={fileName(ref.content)} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                        {value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fileSize != null ? formatFileSize(fileSize) : '—'}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600, wordBreak: 'break-word' }}>
                    {value}
                  </Typography>
                )}
                {ref.description?.trim() && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {ref.description}
                  </Typography>
                )}
              </Box>
            );
          })
        )}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('file_upload_title', currentLanguage)}
        </Typography>
        {attachments.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {missing('file_upload_title')}
          </Typography>
        ) : (
          attachments.map(file => {
            const name = fileName(file.key);
            return (
              <Box
                key={file.key}
                onClick={() => void openFile(file.key, file.description || '')}
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.75, cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 0.5,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileGlyph name={name} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {file.size != null ? formatFileSize(file.size) : '—'}
                  </Typography>
                  {file.description?.trim() && (
                    <Typography variant="body2" color="text.secondary">
                      {file.description}
                    </Typography>
                  )}
                </Box>
                <IconButton size="small" onClick={event => { event.stopPropagation(); void download(file.key); }} aria-label={name}>
                  <Download fontSize="small" />
                </IconButton>
              </Box>
            );
          })
        )}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('metadata', currentLanguage)}
        </Typography>
        {visibleMetadata.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {missing('metadata')}
          </Typography>
        ) : (
          visibleMetadata.map((item, index) => (
            <Typography key={`${item.key}-${index}`} variant="body2" sx={{ mt: 0.5 }}>
              {item.key}: {item.value}
            </Typography>
          ))
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
        youtubeData={detailPopup?.youtubeData}
        linkOpenLabel={t('reference_open_link', currentLanguage)}
        youtubePreviewLabel={t('reference_play_video', currentLanguage)}
        onYoutubePreview={data => {
          setYoutubeModal(data);
          setDetailPopup(null);
        }}
      />
      <Dialog open={!!youtubeModal} onClose={() => setYoutubeModal(null)} maxWidth="lg" fullWidth>
        <DialogContent sx={{ p: 2 }}>
          {youtubeModal && (
            <Box sx={{ position: 'relative', paddingTop: '56.25%', borderRadius: 1, overflow: 'hidden', bgcolor: '#000' }}>
              <iframe
                title="YouTube video"
                src={`https://www.youtube.com/embed/${youtubeModal.videoId}?start=${youtubeModal.startSeconds}&autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AnswerReferenceList;
