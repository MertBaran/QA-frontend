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
  Fade,
} from '@mui/material';
import { Close, Send } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import { CreateQuestionData } from '../../types/question';
import RichTextEditor from '../ui/RichTextEditor';
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
  const { name: themeName } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
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
              <strong>{t('this_question_about', currentLanguage)}:</strong> {aboutQuestion.title}
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
          label={t('question_title', currentLanguage)}
          fullWidth
          value={questionTitle}
          onChange={(e) => setQuestionTitle(e.target.value)}
          disabled={submitting}
          error={error.includes('title')}
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
            {t('question_content', currentLanguage)}
          </Typography>
          <RichTextEditor
          value={questionContent}
            onChange={(value) => setQuestionContent(value || '')}
            minHeight={300}
          error={error.includes('content')}
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

