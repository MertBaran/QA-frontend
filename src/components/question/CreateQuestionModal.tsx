import React from 'react';
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
} from '@mui/material';
import { categories } from '../../types/question';
import { t } from '../../utils/translations';
import RichTextEditor from '../ui/RichTextEditor';
import { useAppSelector } from '../../store/hooks';
import papyrusWhole from '../../asset/textures/papyrus_whole.png';
import papyrusWholeDark from '../../asset/textures/papyrus_whole_dark.png';

interface CreateQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
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
}

const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({
  open,
  onClose,
  onSubmit,
  question,
  onQuestionChange,
  validationErrors,
  isSubmitting,
  currentLanguage,
}) => {
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';

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
          ...(isPapirus ? {
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: mode === 'dark' ? `url(${papyrusWholeDark})` : `url(${papyrusWhole})`,
              backgroundSize: '110%', // Yakınlaştırılmış texture
              backgroundPosition: 'center 25%',
              backgroundRepeat: 'no-repeat',
              opacity: mode === 'dark' ? 0.12 : 0.15,
              pointerEvents: 'none',
              zIndex: 0,
            },
            '& > *': {
              position: 'relative',
              zIndex: 1,
            },
          } : {}),
        }
      }}
      PaperProps={{
        sx: (theme) => ({
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
            : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
        })
      }}
    >
      <DialogTitle sx={{ 
        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 700,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        pb: 2,
        px: 3,
      }}>
        {t('new_question', currentLanguage)}
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
            <InputLabel sx={(theme) => ({ color: validationErrors.category ? theme.palette.error.main : theme.palette.text.secondary })}>{t('category', currentLanguage)}</InputLabel>
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
        </Stack>
      </DialogContent>
      <DialogActions sx={(theme) => ({ px: 3, py: 2, gap: 2, borderTop: `1px solid ${theme.palette.divider}` })}>
        <Button 
          onClick={onClose}
          sx={(theme) => ({ 
            color: theme.palette.text.secondary,
            '&:hover': {
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            }
          })}
        >
          {t('cancel', currentLanguage)}
        </Button>
        <Button 
          onClick={onSubmit}
          variant="contained"
          disabled={!question.title.trim() || !question.content.trim() || isSubmitting}
          sx={(theme) => ({
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`
                : `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            },
            '&:disabled': {
              background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              color: theme.palette.text.disabled,
            }
          })}
        >
          {isSubmitting ? t('creating', currentLanguage) : t('create_question', currentLanguage)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateQuestionModal;
