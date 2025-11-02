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
} from '@mui/material';
import { categories } from '../../types/question';
import { t } from '../../utils/translations';

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
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          margin: 1,
          maxHeight: '95vh',
          minWidth: 500,
          width: '100%',
        }
      }}
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, rgba(30, 58, 71, 0.95) 0%, rgba(21, 42, 53, 0.98) 100%)',
          border: '1px solid rgba(255, 184, 0, 0.15)',
          color: 'white',
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 700,
        borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
        pb: 2,
        px: 3,
      }}>
        {t('new_question', currentLanguage)}
      </DialogTitle>
      <DialogContent sx={{ overflow: 'auto', maxHeight: '70vh', px: 3 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
            * {t('validation_title_min', currentLanguage)}, {t('validation_content_min', currentLanguage).toLowerCase()}
          </Typography>
          <TextField
            label={t('question_title', currentLanguage)}
            fullWidth
            value={question.title}
            onChange={(e) => onQuestionChange('title', e.target.value)}
            error={!!validationErrors.title}
            helperText={validationErrors.title}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: validationErrors.title ? '#f44336' : 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: validationErrors.title ? '#f44336' : 'rgba(255, 184, 0, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: validationErrors.title ? '#f44336' : '#FFB800',
                },
              },
              '& .MuiInputLabel-root': {
                color: validationErrors.title ? '#f44336' : 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: validationErrors.title ? '#f44336' : '#FFB800',
                },
              },
              '& .MuiFormHelperText-root': {
                color: '#f44336',
              },
            }}
          />
          <TextField
            label={t('question_content', currentLanguage)}
            fullWidth
            multiline
            rows={4}
            value={question.content}
            onChange={(e) => onQuestionChange('content', e.target.value)}
            error={!!validationErrors.content}
            helperText={validationErrors.content}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: validationErrors.content ? '#f44336' : 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: validationErrors.content ? '#f44336' : 'rgba(255, 184, 0, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: validationErrors.content ? '#f44336' : '#FFB800',
                },
              },
              '& .MuiInputLabel-root': {
                color: validationErrors.content ? '#f44336' : 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: validationErrors.content ? '#f44336' : '#FFB800',
                },
              },
              '& .MuiFormHelperText-root': {
                color: '#f44336',
              },
            }}
          />
          <FormControl fullWidth error={!!validationErrors.category}>
            <InputLabel sx={{ color: validationErrors.category ? '#f44336' : 'rgba(255, 255, 255, 0.7)' }}>{t('category', currentLanguage)}</InputLabel>
            <Select
              value={question.category}
              onChange={(e) => onQuestionChange('category', e.target.value)}
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: validationErrors.category ? '#f44336' : 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: validationErrors.category ? '#f44336' : 'rgba(255, 184, 0, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: validationErrors.category ? '#f44336' : '#FFB800',
                },
                '& .MuiSvgIcon-root': {
                  color: validationErrors.category ? '#f44336' : 'rgba(255, 255, 255, 0.7)',
                },
              }}
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
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: validationErrors.tags ? '#f44336' : 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: validationErrors.tags ? '#f44336' : 'rgba(255, 184, 0, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: validationErrors.tags ? '#f44336' : '#FFB800',
                },
              },
              '& .MuiInputLabel-root': {
                color: validationErrors.tags ? '#f44336' : 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: validationErrors.tags ? '#f44336' : '#FFB800',
                },
              },
              '& .MuiFormHelperText-root': {
                color: '#f44336',
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 2, borderTop: '1px solid rgba(255, 184, 0, 0.2)' }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.1)',
            }
          }}
        >
          {t('cancel', currentLanguage)}
        </Button>
        <Button 
          onClick={onSubmit}
          variant="contained"
          disabled={!question.title.trim() || !question.content.trim() || isSubmitting}
          sx={{
            background: 'linear-gradient(135deg, #00ED64 0%, #00C853 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00FF6B 0%, #00ED64 100%)',
            },
            '&:disabled': {
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.3)',
            }
          }}
        >
          {isSubmitting ? t('creating', currentLanguage) : t('create_question', currentLanguage)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateQuestionModal;
