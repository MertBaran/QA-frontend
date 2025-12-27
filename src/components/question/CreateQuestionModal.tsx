import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Dialog as PreviewDialog,
} from '@mui/material';
import { Image as ImageIcon, Delete, ZoomIn } from '@mui/icons-material';
import { categories } from '../../types/question';
import { t } from '../../utils/translations';
import RichTextEditor from '../ui/RichTextEditor';
import { useAppSelector } from '../../store/hooks';
import papyrusWhole from '../../asset/textures/papyrus_whole.png';
import papyrusWholeDark from '../../asset/textures/papyrus_whole_dark.png';

interface CreateQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (options: { thumbnailFile?: File | null; removeThumbnail?: boolean }) => Promise<void> | void;
  question: {
    title: string;
    content: string;
    category: string;
    tags: string;
  };
  onQuestionChange: (field: string, value: string) => void;
  validationErrors: {
    title?: string;
    content?: string;
    category?: string;
    tags?: string;
  };
  isSubmitting: boolean;
  currentLanguage: string;
  mode?: 'create' | 'edit';
  initialThumbnailUrl?: string | null;
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
}) => {
  const { name: themeName, mode: themeMode } = useAppSelector((state) => state.theme);
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
  const submitLabel = isEditMode ? t('update_question', currentLanguage) : t('create_question', currentLanguage);

  const helperText = t('question_thumbnail_helper', currentLanguage).replace('{size}', String(MAX_THUMBNAIL_SIZE_MB));
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
          minWidth: 700,
          width: '100%',
          position: 'relative',
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
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          pb: 2,
          px: 3,
        }}
      >
        {dialogTitle}
      </DialogTitle>
      <DialogContent sx={{ overflow: 'auto', maxHeight: '70vh', px: 3 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, mb: 1 }}>
            * {t('validation_title_min', currentLanguage)}, {t('validation_content_min', currentLanguage).toLowerCase()}
          </Typography>
          <TextField
            label={t('question_title', currentLanguage)}
            fullWidth
            value={question.title}
            onChange={(e) => onQuestionChange('title', e.target.value)}
            error={!!validationErrors.title}
            helperText={validationErrors.title}
            sx={(theme) => ({
              '& .MuiOutlinedInput-root': {
                color: theme.palette.text.primary,
                '& fieldset': {
                  borderColor: validationErrors.title ? theme.palette.error.main : theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: validationErrors.title ? theme.palette.error.main : theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: validationErrors.title ? theme.palette.error.main : theme.palette.primary.main,
                },
              },
              '& .MuiInputLabel-root': {
                color: validationErrors.title ? theme.palette.error.main : theme.palette.text.secondary,
                '&.Mui-focused': {
                  color: validationErrors.title ? theme.palette.error.main : theme.palette.primary.main,
                },
              },
              '& .MuiFormHelperText-root': {
                color: theme.palette.error.main,
              },
            })}
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 1, color: (theme) => theme.palette.text.secondary }}>
              {t('question_content', currentLanguage)}
            </Typography>
            <RichTextEditor
              value={question.content}
              onChange={(value) => onQuestionChange('content', value || '')}
              minHeight={300}
              error={!!validationErrors.content}
              helperText={validationErrors.content}
            />
          </Box>
          <FormControl fullWidth error={!!validationErrors.category}>
            <InputLabel
              sx={(theme) => ({
                color: validationErrors.category ? theme.palette.error.main : theme.palette.text.secondary,
              })}
            >
              {t('category', currentLanguage)}
            </InputLabel>
            <Select
              value={question.category}
              onChange={(e) => onQuestionChange('category', e.target.value)}
              sx={(theme) => ({
                color: theme.palette.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: validationErrors.category ? theme.palette.error.main : theme.palette.divider,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: validationErrors.category ? theme.palette.error.main : theme.palette.primary.main,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: validationErrors.category ? theme.palette.error.main : theme.palette.primary.main,
                },
                '& .MuiSvgIcon-root': {
                  color: validationErrors.category ? theme.palette.error.main : theme.palette.text.secondary,
                },
              })}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t('tags', currentLanguage)}
            fullWidth
            value={question.tags}
            onChange={(e) => onQuestionChange('tags', e.target.value)}
            placeholder={t('tags_placeholder', currentLanguage)}
            error={!!validationErrors.tags}
            helperText={validationErrors.tags}
            sx={(theme) => ({
              '& .MuiOutlinedInput-root': {
                color: theme.palette.text.primary,
                '& fieldset': {
                  borderColor: validationErrors.tags ? theme.palette.error.main : theme.palette.divider,
                },
                '&:hover fieldset': {
                  borderColor: validationErrors.tags ? theme.palette.error.main : theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: validationErrors.tags ? theme.palette.error.main : theme.palette.primary.main,
                },
              },
              '& .MuiInputLabel-root': {
                color: validationErrors.tags ? theme.palette.error.main : theme.palette.text.secondary,
                '&.Mui-focused': {
                  color: validationErrors.tags ? theme.palette.error.main : theme.palette.primary.main,
                },
              },
              '& .MuiFormHelperText-root': {
                color: theme.palette.error.main,
              },
            })}
          />

          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 1, color: (theme) => theme.palette.text.secondary }}>
              {t('question_thumbnail_label', currentLanguage)}
            </Typography>
            <Box
              sx={(theme) => ({
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                padding: 2,
                borderRadius: 2,
                border: `1px dashed ${theme.palette.divider}`,
                backgroundColor:
                  theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              })}
            >
              <Box
                sx={(theme) => ({
                  width: 96,
                  height: 96,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: thumbnailPreview ? 'pointer' : 'default',
                })}
                onClick={(e) => {
                  if (thumbnailPreview) {
                    e.stopPropagation();
                    setPreviewOpen(true);
                  }
                }}
              >
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Question thumbnail preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <ImageIcon sx={{ fontSize: 36, color: (theme) => theme.palette.text.disabled }} />
                )}

                {thumbnailPreview && (
                  <Tooltip title={t('question_thumbnail_preview', currentLanguage)}>
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.35)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.55)' },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewOpen(true);
                      }}
                    >
                      <ZoomIn fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
                  {helperText}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleThumbnailChange}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<ImageIcon />}
                    onClick={handleSelectThumbnail}
                    disabled={isSubmitting}
                  >
                    {t('question_thumbnail_select', currentLanguage)}
                  </Button>
                  {showRemoveButton && (
                    <Button
                      variant="text"
                      color="secondary"
                      startIcon={<Delete />}
                      onClick={handleRemoveThumbnail}
                      disabled={isSubmitting}
                    >
                      {removeButtonLabel}
                    </Button>
                  )}
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
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={(theme) => ({ px: 3, py: 2, gap: 2, borderTop: `1px solid ${theme.palette.divider}` })}
      >
        <Button
          onClick={onClose}
          sx={(theme) => ({
            color: theme.palette.text.secondary,
            '&:hover': {
              background:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
            },
          })}
        >
          {t('cancel', currentLanguage)}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!question.title.trim() || !question.content.trim() || isSubmitting || !!thumbnailError}
          sx={(theme) => ({
            background:
              theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
                : `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
            '&:hover': {
              background:
                theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            },
            '&:disabled': {
              background:
                theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
              color: theme.palette.text.disabled,
            },
          })}
        >
          {isSubmitting ? t(isEditMode ? 'updating' : 'creating', currentLanguage) : submitLabel}
        </Button>
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
