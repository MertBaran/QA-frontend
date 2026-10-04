import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Stack,
  Button,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  Dialog,
  DialogContent,
  Tooltip,
} from '@mui/material';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import { Add, Delete, OpenInNew, YouTube } from '@mui/icons-material';
import { t } from '../../utils/translations';
import { referenceNeedsDescription } from '../../utils/filledEntries';
import { getNegativeActionColor } from '../../utils/themeNegativeColor';
import { useAppSelector } from '../../store/hooks';
import ReferenceContentSelector from './ReferenceContentSelector';
import type { AttachedFileOption } from './ReferenceContentSelector';
import ItemDetailPopup from '../ui/ItemDetailPopup';

/** Parses YouTube URL and returns { videoId, startSeconds } or null */
const parseYouTubeUrl = (url: string): { videoId: string; startSeconds: number } | null => {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  let videoId: string | null = null;
  let startSeconds = 0;

  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) videoId = watchMatch[1];

  const tMatch = trimmed.match(/[?&]t=([^&]+)/);
  if (tMatch) {
    const tVal = tMatch[1];
    let total = 0;
    const hPart = tVal.match(/(\d+)h/);
    const mPart = tVal.match(/(\d+)m/);
    const sPart = tVal.match(/(\d+)s/);
    const plainSec = tVal.match(/^(\d+)$/);
    const afterM = tVal.match(/m(\d+)$/);
    if (hPart) total += parseInt(hPart[1], 10) * 3600;
    if (mPart) total += parseInt(mPart[1], 10) * 60;
    if (sPart) total += parseInt(sPart[1], 10);
    else if (afterM) total += parseInt(afterM[1], 10);
    else if (plainSec && !hPart && !mPart) total = parseInt(plainSec[1], 10);
    startSeconds = total;
  }
  const startMatch = trimmed.match(/[?&]start=(\d+)/);
  if (startMatch) startSeconds = parseInt(startMatch[1], 10);

  return videoId ? { videoId, startSeconds } : null;
};

export type ReferenceType = 'link' | 'soru' | 'cevap' | 'yorum' | 'dosya';

export interface CreateQuestionRightState {
  references: { type: ReferenceType; content: string; description: string }[];
  metadata: { key: string; value: string }[];
}

const REFERENCE_TYPES: { value: ReferenceType; i18nKey: string }[] = [
  { value: 'link', i18nKey: 'reference_type_link' },
  { value: 'soru', i18nKey: 'reference_type_question' },
  { value: 'cevap', i18nKey: 'reference_type_answer' },
  { value: 'yorum', i18nKey: 'reference_type_comment' },
  { value: 'dosya', i18nKey: 'reference_type_file' },
];

interface CreateQuestionRightModalProps {
  open: boolean;
  state: CreateQuestionRightState;
  onStateChange: (state: CreateQuestionRightState) => void;
  currentLanguage: string;
  /** Attached files for dosya reference type */
  attachedFiles?: AttachedFileOption[];
  /** Currently hovered reference index (from content ref links) */
  hoveredRefIndex?: number | null;
  /** Callback when hovering over a reference item */
  onRefHover?: (refIndex: number | null) => void;
  /** Edit modunda referans ve metadata düzenlenemez */
  readOnly?: boolean;
  /** Cevap yazımında metadata sekmesi yok */
  hideMetadata?: boolean;
}

const CreateQuestionRightModal: React.FC<CreateQuestionRightModalProps> = ({
  open,
  state,
  onStateChange,
  currentLanguage,
  attachedFiles = [],
  hoveredRefIndex,
  onRefHover,
  readOnly = false,
  hideMetadata = false,
}) => {
  const theme = useTheme();
  const { name: themeName } = useAppSelector((s) => s.theme);
  const negativeColor = getNegativeActionColor(themeName, theme.palette.mode);
  const { references, metadata } = state;
  const [tabIndex, setTabIndex] = useState(0);
  const [youtubeModal, setYoutubeModal] = useState<{ videoId: string; startSeconds: number } | null>(null);
  const [linkPreview, setLinkPreview] = useState<{ url: string; youtube: { videoId: string; startSeconds: number } | null } | null>(null);

  if (!open) return null;

  const setReferences = (refs: { type: ReferenceType; content: string; description: string }[]) =>
    onStateChange({ ...state, references: refs });
  const setMetadata = (meta: { key: string; value: string }[]) =>
    onStateChange({ ...state, metadata: meta });

  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        minWidth: 0,
        flexShrink: 0,
        minHeight: 0,
        height: '100%',
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
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Box sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth" sx={{ minHeight: 48 }}>
            <Tab label={t('references', currentLanguage)} sx={{ typography: 'body1' }} />
            {!hideMetadata && (
              <Tab label={t('metadata', currentLanguage)} sx={{ typography: 'body1' }} />
            )}
          </Tabs>
        </Box>
        <Box sx={(theme) => ({ flex: 1, overflow: 'auto', p: 3, pt: 4, ...getScrollbarSx(theme) })}>
          {tabIndex === 0 && (
            <Stack spacing={1.5} sx={{ overflow: 'visible' }}>
              {references.map((ref, idx) => (
                <Box
                  key={idx}
                  onMouseEnter={() => onRefHover?.(idx)}
                  onMouseLeave={() => onRefHover?.(null)}
                  sx={(theme) => ({
                    position: 'relative',
                    p: 1.5,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.default,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ flex: 1, minWidth: 0 }} disabled={readOnly}>
                    <InputLabel>{t('reference_type', currentLanguage)}</InputLabel>
                    <Select
                      value={ref.type ?? 'link'}
                      label={t('reference_type', currentLanguage)}
                      onChange={(e) => {
                        if (readOnly) return;
                        const next = [...references];
                        next[idx] = { ...next[idx], type: e.target.value as ReferenceType, content: '' };
                        setReferences(next);
                      }}
                      sx={{ '& .MuiSelect-select': { color: (theme) => theme.palette.text.primary } }}
                    >
                      {REFERENCE_TYPES.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {t(opt.i18nKey, currentLanguage)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                    {!readOnly && (
                    <IconButton
                      size="small"
                      onClick={() => setReferences(references.filter((_, i) => i !== idx))}
                      sx={{ flexShrink: 0, color: negativeColor }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <ReferenceContentSelector
                      type={ref.type}
                      value={ref.content}
                      onChange={(v) => {
                        if (readOnly) return;
                        const next = [...references];
                        next[idx] = { ...next[idx], content: v };
                        setReferences(next);
                      }}
                      attachedFiles={attachedFiles}
                      currentLanguage={currentLanguage}
                      readOnly={readOnly}
                    />
                    {ref.type === 'link' && (() => {
                      const yt = parseYouTubeUrl(ref.content);
                      const url = ref.content?.trim();
                      const isUrl = !!url && (url.startsWith('http://') || url.startsWith('https://'));
                      if (url && (yt || isUrl)) {
                        return (
                          <Tooltip title={t(yt ? 'reference_play_video' : 'reference_open_link', currentLanguage)}>
                            <IconButton
                              size="small"
                              onClick={() => setLinkPreview({ url, youtube: yt })}
                              sx={{ flexShrink: 0, color: yt ? '#FF0000' : undefined }}
                            >
                              {yt ? <YouTube sx={{ fontSize: 28 }} /> : <OpenInNew sx={{ fontSize: 24 }} />}
                            </IconButton>
                          </Tooltip>
                        );
                      }
                      return null;
                    })()}
                  </Box>
                  <TextField
                    label={t('reference_description', currentLanguage)}
                    value={ref.description}
                    onChange={(e) => {
                      if (readOnly) return;
                      const next = [...references];
                      next[idx] = { ...next[idx], description: e.target.value };
                      setReferences(next);
                    }}
                    size="small"
                    required={referenceNeedsDescription(ref.type) && !!ref.content?.trim()}
                    error={referenceNeedsDescription(ref.type) && !!ref.content?.trim() && !ref.description?.trim()}
                    helperText={referenceNeedsDescription(ref.type) && !!ref.content?.trim() && !ref.description?.trim()
                      ? t('reference_description_required', currentLanguage)
                      : undefined}
                    InputProps={{ readOnly: readOnly }}
                    sx={{ '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary } }}
                  />
                </Box>
              ))}
              {!readOnly && (
              <Button startIcon={<Add />} onClick={() => setReferences([...references, { type: 'link', content: '', description: '' }])}>
                {t('add_reference', currentLanguage)}
              </Button>
              )}
            </Stack>
          )}
          {tabIndex === 1 && !hideMetadata && (
            <Stack spacing={1.5}>
              {metadata.map((m, idx) => (
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
                  <TextField
                    label={t('metadata_key', currentLanguage)}
                    value={m.key}
                    onChange={(e) => {
                      if (readOnly) return;
                      const next = [...metadata];
                      next[idx] = { ...next[idx], key: e.target.value };
                      setMetadata(next);
                    }}
                    size="small"
                    InputProps={{ readOnly: readOnly }}
                    sx={{ flex: 1, minWidth: 120, '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary } }}
                  />
                  <TextField
                    label={t('metadata_value', currentLanguage)}
                    value={m.value}
                    onChange={(e) => {
                      if (readOnly) return;
                      const next = [...metadata];
                      next[idx] = { ...next[idx], value: e.target.value };
                      setMetadata(next);
                    }}
                    size="small"
                    InputProps={{ readOnly: readOnly }}
                    sx={{ flex: 1, minWidth: 120, '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary } }}
                  />
                  {!readOnly && (
                  <IconButton
                    size="small"
                    onClick={() => setMetadata(metadata.filter((_, i) => i !== idx))}
                    sx={{ flexShrink: 0, color: negativeColor }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                  )}
                </Box>
              ))}
              {!readOnly && (
              <Button startIcon={<Add />} onClick={() => setMetadata([...metadata, { key: '', value: '' }])}>
                {t('add_metadata', currentLanguage)}
              </Button>
              )}
            </Stack>
          )}
        </Box>
      </Box>
      <ItemDetailPopup
        open={!!linkPreview}
        onClose={() => setLinkPreview(null)}
        title={t('reference_type_link', currentLanguage)}
        details={[{ key: 'URL', value: linkPreview?.url ?? '' }]}
        currentLanguage={currentLanguage}
        descriptionLabel={t('reference_description', currentLanguage)}
        linkUrl={linkPreview?.url}
        youtubeData={linkPreview?.youtube ?? undefined}
        linkOpenLabel={t('reference_open_link', currentLanguage)}
        youtubePreviewLabel={t('reference_play_video', currentLanguage)}
        onYoutubePreview={data => {
          setYoutubeModal(data);
          setLinkPreview(null);
        }}
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

export default CreateQuestionRightModal;
