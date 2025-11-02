import React, { useState } from 'react';
import {
  Box,
  Drawer,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close, Send } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import { CreateQuestionData } from '../../types/question';

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '90%',
    maxWidth: 600,
    background: 'linear-gradient(135deg, rgba(10, 26, 35, 0.98) 0%, rgba(21, 42, 53, 0.99) 100%)',
    borderLeft: '1px solid rgba(255, 184, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: theme.spacing(3),
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
  color: 'white',
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  '&:hover': {
    background: 'linear-gradient(135deg, #FF8F00 0%, #FF6B00 100%)',
  },
  '&:disabled': {
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.3)',
  },
}));

interface AskQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateQuestionData) => Promise<void>;
  aboutQuestion?: { id: string; title: string };
  aboutAnswer?: { id: string; content: string };
  title?: string;
}

const AskQuestionModal: React.FC<AskQuestionModalProps> = ({
  open,
  onClose,
  onSubmit,
  aboutQuestion,
  aboutAnswer,
  title,
}) => {
  const { currentLanguage } = useAppSelector(state => state.language);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (!questionTitle.trim() || !questionContent.trim()) {
      setError(t('validation_required', currentLanguage));
      return;
    }

    if (questionTitle.length < 10) {
      setError(t('validation_title_min', currentLanguage));
      return;
    }

    if (questionContent.length < 20) {
      setError(t('validation_content_min', currentLanguage));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSubmit({ title: questionTitle, content: questionContent });
      setQuestionTitle('');
      setQuestionContent('');
      onClose();
    } catch (err: any) {
      console.error('Soru oluşturulurken hata:', err);
      setError(err.response?.data?.error || t('error', currentLanguage));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setQuestionTitle('');
      setQuestionContent('');
      setError('');
      onClose();
    }
  };

  return (
    <StyledDrawer
      anchor="right"
      open={open}
      onClose={handleClose}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
            {title || t('ask_question_about', currentLanguage)}
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={submitting}
            sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* İlişkili içerik bilgisi */}
        {aboutQuestion && (
          <Alert 
            severity="info" 
            sx={{ mb: 3, bgcolor: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)' }}
          >
            <Typography variant="body2" sx={{ color: 'white' }}>
              <strong>{t('this_question_about', currentLanguage)}:</strong> {aboutQuestion.title}
            </Typography>
          </Alert>
        )}

        {aboutAnswer && (
          <Alert 
            severity="info" 
            sx={{ mb: 3, bgcolor: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)' }}
          >
            <Typography variant="body2" sx={{ color: 'white' }}>
              <strong>{t('this_question_about', currentLanguage)}:</strong> {aboutAnswer.content.substring(0, 100)}...
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label={t('question_title', currentLanguage)}
          fullWidth
          value={questionTitle}
          onChange={(e) => setQuestionTitle(e.target.value)}
          disabled={submitting}
          error={error.includes('title')}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#FFB800' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
          }}
        />

        <TextField
          label={t('question_content', currentLanguage)}
          multiline
          rows={8}
          fullWidth
          value={questionContent}
          onChange={(e) => setQuestionContent(e.target.value)}
          disabled={submitting}
          error={error.includes('content')}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#FFB800' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
          }}
        />

        <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={submitting}
            sx={{
              flex: 1,
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': { borderColor: 'white' },
            }}
          >
            {t('cancel', currentLanguage)}
          </Button>
          <ActionButton
            onClick={handleSubmit}
            disabled={submitting || !questionTitle.trim() || !questionContent.trim()}
            sx={{ flex: 1 }}
            endIcon={submitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Send />}
          >
            {submitting ? t('creating', currentLanguage) : t('ask_question', currentLanguage)}
          </ActionButton>
        </Box>
      </Box>
    </StyledDrawer>
  );
};

export default AskQuestionModal;

