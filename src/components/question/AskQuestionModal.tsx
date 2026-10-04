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
import RichTextEditor from '../ui/RichTextEditor';
import {
  QUESTION_SUMMARY_MIN_LENGTH,
  QUESTION_SUMMARY_MAX_LENGTH,
  QUESTION_DETAIL_MIN_LENGTH,
  QUESTION_DETAIL_MAX_LENGTH,
} from '../../constants/questionValidation';
import papyrusWhole from '../../asset/textures/papyrus_whole.png';
import papyrusWholeDark from '../../asset/textures/papyrus_whole_dark.png';

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'isPapirus',
})<{ isPapirus?: boolean }>(({ theme, isPapirus }) => ({
  '& .MuiDrawer-paper': {
    width: '90%',
    maxWidth: 800,
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
      : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
    borderLeft: `1px solid ${theme.palette.divider}`,
    backdropFilter: 'blur(10px)',
    color: theme.palette.text.primary,
    padding: theme.spacing(3),
    position: 'fixed',
    overflow: 'hidden',
    right: 0,
    left: 'auto !important',
    ...(isPapirus ? {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: theme.palette.mode === 'dark' ? `url(${papyrusWholeDark})` : `url(${papyrusWhole})`,
        backgroundSize: '150%', // Yakınlaştırılmış texture
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: theme.palette.mode === 'dark' ? 0.12 : 0.15,
        pointerEvents: 'none',
        zIndex: 0,
      },
      '& > *': {
        position: 'relative',
        zIndex: 1,
      },
    } : {}),
  },
  '& .MuiDrawer-paperAnchorRight': {
    right: 0,
    left: 'auto !important',
    transform: 'none !important',
  },
  '& .MuiBackdrop-root': {
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: theme.palette.primary.contrastText,
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  },
  '&:disabled': {
    background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    color: theme.palette.text.disabled,
  },
}));

interface AskQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateQuestionData) => Promise<void>;
  aboutQuestion?: { id: string; summary: string };
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
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const [questionSummary, setQuestionSummary] = useState('');
  const [questionDetail, setQuestionDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async () => {
    if (!questionSummary.trim() || !questionDetail.trim()) {
      setError(t('validation_required', currentLanguage));
      return;
    }

    if (questionSummary.length < QUESTION_SUMMARY_MIN_LENGTH) {
      setError(t('validation_summary_min', currentLanguage));
      return;
    }
    if (questionSummary.length > QUESTION_SUMMARY_MAX_LENGTH) {
      setError(t('validation_summary_max', currentLanguage));
      return;
    }
    if (questionDetail.length < QUESTION_DETAIL_MIN_LENGTH) {
      setError(t('validation_detail_min', currentLanguage));
      return;
    }
    if (questionDetail.length > QUESTION_DETAIL_MAX_LENGTH) {
      setError(t('validation_detail_max', currentLanguage));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSubmit({ summary: questionSummary.slice(0, QUESTION_SUMMARY_MAX_LENGTH), detail: questionDetail.slice(0, QUESTION_DETAIL_MAX_LENGTH) });
      setQuestionSummary('');
      setQuestionDetail('');
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
      setQuestionSummary('');
      setQuestionDetail('');
      setError('');
      onClose();
    }
  };

  return (
    <StyledDrawer
      anchor="right"
      open={open}
      onClose={handleClose}
      isPapirus={isPapirus}
      variant="temporary"
      transitionDuration={0}
      ModalProps={{
        keepMounted: false,
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(2px)',
        },
      }}
      PaperProps={{
        sx: {
          transition: 'none !important',
          right: 0,
          left: 'auto !important',
          transform: 'none !important',
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ color: (theme) => theme.palette.text.primary, fontWeight: 700 }}>
            {title || t('ask_question_about', currentLanguage)}
          </Typography>
          <IconButton
            onClick={handleClose}
            disabled={submitting}
            sx={(theme) => ({ color: theme.palette.text.secondary, '&:hover': { color: theme.palette.text.primary } })}
          >
            <Close />
          </IconButton>
        </Box>

        {/* İlişkili içerik bilgisi */}
        {aboutQuestion && (
          <Alert 
            severity="info" 
            sx={(theme) => ({ 
              mb: 3, 
              bgcolor: theme.palette.mode === 'dark' ? `${theme.palette.primary.main}22` : `${theme.palette.primary.main}11`, 
              border: `1px solid ${theme.palette.primary.main}66` 
            })}
          >
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.primary }}>
              <strong>{t('this_question_about', currentLanguage)}:</strong> {aboutQuestion.summary}
            </Typography>
          </Alert>
        )}

        {aboutAnswer && (
          <Alert 
            severity="info" 
            sx={(theme) => ({ 
              mb: 3, 
              bgcolor: theme.palette.mode === 'dark' ? `${theme.palette.primary.main}22` : `${theme.palette.primary.main}11`, 
              border: `1px solid ${theme.palette.primary.main}66` 
            })}
          >
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.primary }}>
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
          label={t('question_summary', currentLanguage)}
          fullWidth
          value={questionSummary}
          onChange={(e) => setQuestionSummary(e.target.value)}
          disabled={submitting}
          error={error.includes('summary')}
          sx={(theme) => ({
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: theme.palette.text.primary,
              '& fieldset': { borderColor: theme.palette.divider },
              '&:hover fieldset': { borderColor: theme.palette.primary.main },
              '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
            },
            '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
          })}
        />

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, color: (theme) => theme.palette.text.secondary }}>
            {t('question_detail', currentLanguage)}
          </Typography>
          <RichTextEditor
            value={questionDetail}
            onChange={(value) => setQuestionDetail((value || '').slice(0, QUESTION_DETAIL_MAX_LENGTH))}
            minHeight={300}
            maxLength={QUESTION_DETAIL_MAX_LENGTH}
            error={error.includes('detail')}
            helperText={error.includes('detail') ? error : undefined}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
          <Button
            variant="outlined"
            onClick={handleClose}
            disabled={submitting}
            sx={(theme) => ({
              flex: 1,
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              '&:hover': { borderColor: theme.palette.primary.main },
            })}
          >
            {t('cancel', currentLanguage)}
          </Button>
          <ActionButton
            onClick={handleSubmit}
            disabled={submitting || !questionSummary.trim() || !questionDetail.trim() || questionSummary.length > QUESTION_SUMMARY_MAX_LENGTH || questionDetail.length > QUESTION_DETAIL_MAX_LENGTH}
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

