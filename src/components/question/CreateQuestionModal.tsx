import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Dialog as PreviewDialog,
} from '@mui/material';
import { Image as ImageIcon, Delete, Drafts, Group, Alarm } from '@mui/icons-material';
import { t } from '../../utils/translations';
import RichTextEditor from '../ui/RichTextEditor';
import {
  QUESTION_SUMMARY_MIN_LENGTH,
  QUESTION_SUMMARY_MAX_LENGTH,
  QUESTION_DETAIL_MIN_LENGTH,
  QUESTION_DETAIL_MAX_LENGTH,
} from '../../constants/questionValidation';
import { useAppSelector } from '../../store/hooks';
import { getNegativeActionColor } from '../../utils/themeNegativeColor';
import { confirmService } from '../../services/confirmService';
import papyrusWhole from '../../asset/textures/papyrus_whole.png';
import papyrusWholeDark from '../../asset/textures/papyrus_whole_dark.png';
import AskQuestionButton from '../home/AskQuestionButton';


const getActionButtonColor = (themeName: string, mode: 'light' | 'dark', theme: { palette: { primary: { main: string }; divider: string } }) => {
  if (themeName === 'molume') return mode === 'dark' ? '#7A4A75' : '#5E315A';
  if (themeName === 'papirus') return mode === 'dark' ? '#A0522D' : '#8B4513';
  if (themeName === 'magnefite') return mode === 'dark' ? '#9CA3AF' : '#6B7280';
  return theme.palette.primary.main;
};

interface CreateQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (options: { thumbnailFile?: File | null; removeThumbnail?: boolean }) => Promise<void> | void;
  question: {
    summary: string;
    detail: string;
    category: string;
    tags: string;
  };
  onQuestionChange: (field: string, value: string) => void;
  validationErrors: {
    summary?: string;
    detail?: string;
    category?: string;
    tags?: string;
  };
  isSubmitting: boolean;
  currentLanguage: string;
  mode?: 'create' | 'edit';
  initialThumbnailUrl?: string | null;
  /** When true, renders as a panel inside CreateQuestionFlow (no Dialog wrapper) */
  embedded?: boolean;
  /** References for content-ref linking (from CreateQuestionFlow) */
  references?: { type: string; content: string; description: string }[];
  /** Currently hovered reference index for highlight sync */
  hoveredRefIndex?: number | null;
  /** Callback when user hovers over a reference link in content */
  onRefHover?: (refIndex: number | null) => void;
  /** Soru hakkında soru sorarken gösterilecek (özet üstünde "Bu soru hakkında: xxx") */
  aboutQuestion?: { id: string; summary: string };
  /** Cevap hakkında soru sorarken gösterilecek (özet üstünde "Bu cevap hakkında: xxx") */
  aboutAnswer?: { id: string; content: string };
}

const MAX_THUMBNAIL_SIZE_MB = 5;

const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({
  open,
  onClose,
  onSubmit,
  question,
  onQuestionChange,
  validationErrors,
  isSubmitting,
  currentLanguage,
  mode = 'create',
  initialThumbnailUrl = null,
  embedded = false,
  references,
  hoveredRefIndex,
  onRefHover,
  aboutQuestion,
  aboutAnswer,
}) => {
  const { name: themeName, mode: themeMode } = useAppSelector((state) => state.theme);
  const negativeColor = getNegativeActionColor(themeName, themeMode);
  const isPapirus = themeName === 'papirus';
  const isEditMode = mode === 'edit';

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<'existing' | 'object' | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string>('');
  const [removeExistingThumbnail, setRemoveExistingThumbnail] = useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dialogTitle = isEditMode ? t('edit_question', currentLanguage) : t('new_question', currentLanguage);
  const submitLabel = isEditMode ? t('update_question', currentLanguage) : t('ask', currentLanguage);

  const handleDetailChange = useCallback(
    (value: string | undefined) => {
      if (isEditMode) return;
      onQuestionChange('detail', (value || '').slice(0, QUESTION_DETAIL_MAX_LENGTH));
    },
    [isEditMode, onQuestionChange],
  );

  const hasContent = () =>
    question.summary.trim().length > 0 ||
    question.detail.trim().length > 0 ||
    question.category.trim().length > 0 ||
    question.tags.trim().length > 0 ||
    thumbnailFile !== null ||
    removeExistingThumbnail;

  const handleCancel = async () => {
    if (hasContent()) {
      const confirmed = await confirmService.show({
        message: t('discard_confirmation', currentLanguage),
        type: 'warning',
        confirmText: t('discard_confirm', currentLanguage),
        cancelText: t('cancel', currentLanguage),
        confirmColor: 'warning',
        variant: 'outlined',
      });
      if (!confirmed) return;
    }
    onClose();
  };

  const thumbnailLabel = t('question_thumbnail_label', currentLanguage);
  const thumbnailMaxSize = t('question_thumbnail_max_size', currentLanguage);
  const sizeErrorText = t('question_thumbnail_too_large', currentLanguage).replace('{size}', String(MAX_THUMBNAIL_SIZE_MB));

  useEffect(() => {
    if (open) {
      setThumbnailError('');
      setRemoveExistingThumbnail(false);

      if (previewSource === 'object' && thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }

      if (isEditMode && initialThumbnailUrl) {
        setThumbnailPreview(initialThumbnailUrl);
        setPreviewSource('existing');
      } else {
        setThumbnailPreview(null);
        setPreviewSource(null);
      }

      setThumbnailFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      if (previewSource === 'object' && thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setPreviewSource(null);
      setRemoveExistingThumbnail(false);
      setPreviewOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialThumbnailUrl, isEditMode]);

  useEffect(() => {
    return () => {
      if (previewSource === 'object' && thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [previewSource, thumbnailPreview]);

  const handleSelectThumbnail = () => {
    fileInputRef.current?.click();
  };

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE_MB * 1024 * 1024) {
      setThumbnailError(sizeErrorText);
      return;
    }

    setThumbnailError('');

    if (previewSource === 'object' && thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }

    const objectUrl = URL.createObjectURL(file);
    setThumbnailFile(file);
    setThumbnailPreview(objectUrl);
    setPreviewSource('object');
    setRemoveExistingThumbnail(false);
  };

  const handleRemoveThumbnail = () => {
    // If user selected a new file, just clear the selection and revert to existing thumbnail if there is one
    if (thumbnailFile) {
      if (previewSource === 'object' && thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      setThumbnailFile(null);
      if (isEditMode && initialThumbnailUrl) {
        setThumbnailPreview(initialThumbnailUrl);
        setPreviewSource('existing');
        setRemoveExistingThumbnail(false);
      } else {
        setThumbnailPreview(null);
        setPreviewSource(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Toggle removal of existing thumbnail
    if (isEditMode) {
      if (removeExistingThumbnail) {
        if (initialThumbnailUrl) {
          setThumbnailPreview(initialThumbnailUrl);
          setPreviewSource('existing');
        } else {
          setThumbnailPreview(null);
          setPreviewSource(null);
        }
        setRemoveExistingThumbnail(false);
      } else {
        if (previewSource === 'object' && thumbnailPreview) {
          URL.revokeObjectURL(thumbnailPreview);
        }
        setThumbnailPreview(null);
        setPreviewSource(null);
        setRemoveExistingThumbnail(true);
      }
    } else {
      if (previewSource === 'object' && thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      setThumbnailPreview(null);
      setPreviewSource(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    onSubmit({
      thumbnailFile,
      removeThumbnail: isEditMode ? removeExistingThumbnail : false,
    });
  };

  const showRemoveButton = Boolean(
    thumbnailFile ||
      (isEditMode && (thumbnailPreview || initialThumbnailUrl) && !removeExistingThumbnail) ||
      (isEditMode && removeExistingThumbnail),
  );

  const removeButtonLabel = (() => {
    if (thumbnailFile) {
      return t('question_thumbnail_clear_selection', currentLanguage);
    }
    if (isEditMode && removeExistingThumbnail) {
      return t('question_thumbnail_restore', currentLanguage);
    }
    return t('question_thumbnail_remove', currentLanguage);
  })();

  const thumbnailBox = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, minWidth: 180, alignItems: 'stretch' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleThumbnailChange}
      />
      <Box
        component="button"
        type="button"
        onClick={handleSelectThumbnail}
        disabled={isSubmitting}
        sx={(theme) => ({
          width: '100%',
          height: 140,
          borderRadius: 1,
          border: `1px dashed ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          overflow: 'hidden',
          p: 0,
          flexShrink: 0,
          position: 'relative',
          '&:hover': !isSubmitting ? { borderColor: theme.palette.primary.main, backgroundColor: theme.palette.action.hover } : {},
        })}
      >
        {thumbnailPreview ? (
          <img src={thumbnailPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <ImageIcon sx={{ fontSize: 40, color: (theme) => theme.palette.text.disabled }} />
        )}
        <Typography
          component="span"
          sx={{
            position: 'absolute',
            bottom: 6,
            right: 8,
            fontSize: '0.65rem',
            color: (theme) => theme.palette.text.disabled,
          }}
        >
          {thumbnailMaxSize}
        </Typography>
      </Box>
      {thumbnailError && (
        <Typography variant="caption" color="error">
          {thumbnailError}
        </Typography>
      )}
      {isEditMode && removeExistingThumbnail && (
        <Typography variant="caption" color="warning.main">
          {t('question_thumbnail_remove_info', currentLanguage)}
        </Typography>
      )}
    </Box>
  );

  const validationHint = `* ${t('validation_summary_min', currentLanguage)}, ${t('validation_detail_min', currentLanguage).toLowerCase()}`;

  const formContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, minHeight: 0 }}>
        {(aboutQuestion || aboutAnswer) && (
          <Box
            sx={(theme) => ({
              p: 1.5,
              mb: 1.5,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.mode === 'dark'
                ? `${theme.palette.primary.main}18`
                : `${theme.palette.primary.main}0d`,
            })}
          >
            <Typography
              variant="body1"
              sx={(theme) => ({
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '0.95rem',
              })}
            >
              {aboutQuestion
                ? `${t('this_question_about', currentLanguage)}: ${aboutQuestion.summary}`
                : aboutAnswer
                  ? `${t('this_answer_about', currentLanguage)}: ${aboutAnswer.content.substring(0, 120)}${aboutAnswer.content.length > 120 ? '...' : ''}`
                  : ''}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.secondary, fontWeight: 500, flex: 1 }}>
              {t('question_summary', currentLanguage)}
            </Typography>
            <Box sx={{ minWidth: 180, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, fontWeight: 500, whiteSpace: 'nowrap' }}>
                {thumbnailLabel}
              </Typography>
              {showRemoveButton && (
                <Tooltip title={removeButtonLabel}>
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); handleRemoveThumbnail(); }}
                    disabled={isSubmitting}
                    sx={{ p: 0.25, color: negativeColor }}
                  >
                    <Delete sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch' }}>
          <Box sx={{ flex: 1, minWidth: 0, position: 'relative' }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={question.summary}
              onChange={(e) => !isEditMode && onQuestionChange('summary', e.target.value.slice(0, QUESTION_SUMMARY_MAX_LENGTH))}
              inputProps={{ maxLength: QUESTION_SUMMARY_MAX_LENGTH, readOnly: isEditMode }}
              placeholder={!question.summary.trim() ? validationHint : ''}
              error={!!validationErrors.summary}
              helperText={validationErrors.summary}
              sx={(theme) => ({
                '& .MuiOutlinedInput-root': {
                  color: theme.palette.text.primary,
                  minHeight: 140,
                  maxHeight: 140,
                  alignItems: 'flex-start',
                  '& fieldset': {
                    borderColor: validationErrors.summary ? theme.palette.error.main : theme.palette.divider,
                  },
                  '&:hover fieldset': {
                    borderColor: validationErrors.summary ? theme.palette.error.main : theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: validationErrors.summary ? theme.palette.error.main : theme.palette.primary.main,
                  },
                },
                '& .MuiInputBase-input': {
                  overflowY: 'auto !important',
                },
                '& .MuiInputLabel-root': {
                  color: validationErrors.summary ? theme.palette.error.main : theme.palette.text.secondary,
                  '&.Mui-focused': {
                    color: validationErrors.summary ? theme.palette.error.main : theme.palette.primary.main,
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: theme.palette.error.main,
                },
              })}
            />
            <Typography
              variant="caption"
              sx={(theme) => ({
                position: 'absolute',
                bottom: validationErrors.summary ? 32 : 12,
                right: 14,
                pointerEvents: 'none',
                color: question.summary.length >= QUESTION_SUMMARY_MAX_LENGTH ? theme.palette.error.main : theme.palette.text.secondary,
              })}
            >
              {question.summary.length} / {QUESTION_SUMMARY_MAX_LENGTH}
            </Typography>
          </Box>
          {thumbnailBox}
          </Box>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.secondary, fontWeight: 500 }}>
              {t('question_detail', currentLanguage)}
            </Typography>
            {references && references.length > 0 && (
              <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.disabled }}>
                {t('question_detail_ref_hint', currentLanguage)}
              </Typography>
            )}
          </Box>
          <RichTextEditor
            value={question.detail}
            onChange={handleDetailChange}
            minHeight={200}
            fillHeight
            maxLength={QUESTION_DETAIL_MAX_LENGTH}
            error={!!validationErrors.detail}
            helperText={validationErrors.detail}
            references={references}
            hoveredRefIndex={hoveredRefIndex}
            onRefHover={onRefHover}
            disabled={isEditMode}
            currentLanguage={currentLanguage}
          />
        </Box>
      </Box>
  );

  const actionButtons = (
    <>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Tooltip title={t('save_to_drafts', currentLanguage)}>
          <Button
            variant="outlined"
            startIcon={<Drafts sx={{ fontSize: 20 }} />}
            onClick={() => {}}
            sx={(theme) => {
              const accent = getActionButtonColor(themeName, themeMode, theme);
              return {
                borderColor: accent,
                color: accent,
                '&:hover': {
                  borderColor: accent,
                  backgroundColor: theme.palette.mode === 'dark' ? `${accent}22` : `${accent}11`,
                },
              };
            }}
          >
            {t('save_to_drafts', currentLanguage)}
          </Button>
        </Tooltip>
        <Tooltip title={t('mention', currentLanguage)}>
          <Button
            variant="outlined"
            startIcon={<Group sx={{ fontSize: 20 }} />}
            onClick={() => {}}
            sx={(theme) => {
              const accent = getActionButtonColor(themeName, themeMode, theme);
              return {
                borderColor: accent,
                color: accent,
                '&:hover': {
                  borderColor: accent,
                  backgroundColor: theme.palette.mode === 'dark' ? `${accent}22` : `${accent}11`,
                },
              };
            }}
          >
            {t('mention', currentLanguage)}
          </Button>
        </Tooltip>
        <Tooltip title={t('set_reminder', currentLanguage)}>
          <Button
            variant="outlined"
            startIcon={<Alarm sx={{ fontSize: 20 }} />}
            onClick={() => {}}
            sx={(theme) => {
              const accent = getActionButtonColor(themeName, themeMode, theme);
              return {
                borderColor: accent,
                color: accent,
                '&:hover': {
                  borderColor: accent,
                  backgroundColor: theme.palette.mode === 'dark' ? `${accent}22` : `${accent}11`,
                },
              };
            }}
          >
            {t('set_reminder', currentLanguage)}
          </Button>
        </Tooltip>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          sx={(theme) => ({
            borderColor: 'transparent',
            color: theme.palette.text.secondary,
            '&:hover': {
              borderColor: negativeColor,
              background:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
            },
          })}
        >
          {t('cancel', currentLanguage)}
        </Button>
        <AskQuestionButton
          label={
            isSubmitting
              ? t(isEditMode ? 'updating' : 'creating', currentLanguage)
              : submitLabel
          }
          onClick={() => {
            void handleSubmit();
          }}
          hideIcon
          minWidth={180}
          disabled={
            !question.summary.trim() ||
            !question.detail.trim() ||
            question.summary.length > QUESTION_SUMMARY_MAX_LENGTH ||
            question.detail.length > QUESTION_DETAIL_MAX_LENGTH ||
            isSubmitting ||
            !!thumbnailError
          }
        />
      </Box>
    </>
  );

  const actionsContent = (
    <Box sx={(theme) => ({ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
      {actionButtons}
    </Box>
  );

  if (embedded) {
    return (
      <>
        {open && (
          <Box
            sx={(theme) => ({
              flex: 1,
              minWidth: 400,
              minHeight: 0,
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              background:
                theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
              boxShadow: theme.shadows[8],
              overflow: 'hidden',
              ...(isPapirus
                ? {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: themeMode === 'dark' ? `url(${papyrusWholeDark})` : `url(${papyrusWhole})`,
                      backgroundSize: '110%',
                      backgroundPosition: 'center 25%',
                      backgroundRepeat: 'no-repeat',
                      opacity: themeMode === 'dark' ? 0.12 : 0.15,
                      pointerEvents: 'none',
                      zIndex: 0,
                    },
                    position: 'relative',
                    '& > *': { position: 'relative', zIndex: 1 },
                  }
                : {}),
            })}
          >
            <Box sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}`, py: 1.5, px: 3, display: 'flex', alignItems: 'flex-end' }}>
              <Typography
                sx={{
                  background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {dialogTitle}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', px: 3, py: 2 }}>
              {formContent}
            </Box>
            {actionsContent}
          </Box>
        )}
        <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md">
          {thumbnailPreview && (
            <Box sx={{ p: 0, m: 0 }}>
              <img
                src={thumbnailPreview}
                alt="Question thumbnail large preview"
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
              />
            </Box>
          )}
        </PreviewDialog>
      </>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          margin: 1,
          maxHeight: '95vh',
          minWidth: 600,
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          ...(isPapirus
            ? {
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: themeMode === 'dark' ? `url(${papyrusWholeDark})` : `url(${papyrusWhole})`,
                  backgroundSize: '110%',
                  backgroundPosition: 'center 25%',
                  backgroundRepeat: 'no-repeat',
                  opacity: themeMode === 'dark' ? 0.12 : 0.15,
                  pointerEvents: 'none',
                  zIndex: 0,
                },
                '& > *': {
                  position: 'relative',
                  zIndex: 1,
                },
              }
            : {}),
        },
      }}
      PaperProps={{
        sx: (theme) => ({
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
              : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
        }),
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          py: 1.5,
          px: 3,
          display: 'flex',
          alignItems: 'flex-end',
        }}
      >
        <Typography
          component="span"
          sx={{
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {dialogTitle}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', px: 3, py: 2 }}>
        {formContent}
      </DialogContent>
      <DialogActions sx={(theme) => ({ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' })}>
        {actionButtons}
      </DialogActions>

      <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md">
        {thumbnailPreview && (
          <Box sx={{ p: 0, m: 0 }}>
            <img
              src={thumbnailPreview}
              alt="Question thumbnail large preview"
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            />
          </Box>
        )}
      </PreviewDialog>
    </Dialog>
  );
};

export default CreateQuestionModal;
