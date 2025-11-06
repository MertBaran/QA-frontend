import React from 'react';
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Avatar,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import { Question } from '../../types/question';

const StyledPopover = styled(Popover)(({ theme }) => ({
  '& .MuiPopover-paper': {
    background: theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
      : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
    color: theme.palette.text.primary,
    maxWidth: 400,
    maxHeight: 400,
    overflow: 'auto',
  },
}));

const QuestionItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark'
      ? `${theme.palette.primary.main}22`
      : `${theme.palette.primary.main}11`,
  },
  '&:last-child': {
    borderBottom: 'none',
  },
}));

interface RelatedQuestionsPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  questions: Question[];
  loading?: boolean;
  onQuestionClick?: (questionId: string) => void;
}

const RelatedQuestionsPopover: React.FC<RelatedQuestionsPopoverProps> = ({
  anchorEl,
  onClose,
  questions,
  loading = false,
  onQuestionClick,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector(state => state.language);
  const open = Boolean(anchorEl);


  const handleAvatarClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    
    // Ctrl/Cmd + click veya middle click için yeni sekme
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      window.open(`/profile/${userId}`, '_blank');
      return;
    }

    navigate(`/profile/${userId}`);
  };

  const handleNameClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    
    // Ctrl/Cmd + click veya middle click için yeni sekme
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      window.open(`/profile/${userId}`, '_blank');
      return;
    }

    navigate(`/profile/${userId}`);
  };

  const handleQuestionItemClick = (e: React.MouseEvent, questionId: string) => {
    // Ctrl/Cmd + click veya middle click için yeni sekme
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      window.open(`/questions/${questionId}`, '_blank');
      if (onQuestionClick) {
        onQuestionClick(questionId);
      }
      onClose();
      return;
    }

    if (onQuestionClick) {
      onQuestionClick(questionId);
    }
    onClose();
  };

  return (
    <StyledPopover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 2, minWidth: 300 }}>
        <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary, fontWeight: 600 }}>
          {t('related_questions', currentLanguage)}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
          </Box>
        ) : questions.length === 0 ? (
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, py: 2 }}>
            {t('no_related_questions', currentLanguage)}
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {questions.map((question) => (
              <QuestionItem
                key={question.id}
                onClick={(e) => handleQuestionItemClick(e, question.id)}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    handleQuestionItemClick(e, question.id);
                  }
                }}
              >
                <Avatar 
                  src={question.userInfo?.profile_image || question.author.avatar} 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    mr: 2, 
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.7, transform: 'scale(1.1)' },
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => handleAvatarClick(e, question.author.id)}
                  onMouseDown={(e) => {
                    if (e.button === 1) {
                      handleAvatarClick(e, question.author.id);
                    }
                  }}
                />
                <ListItemText
                  primary={
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: theme.palette.primary.main, 
                          fontWeight: 600, 
                          display: 'block', 
                          mb: 0.5,
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.7, textDecoration: 'underline' },
                          transition: 'all 0.2s ease'
                        }}
                        onClick={(e) => handleNameClick(e, question.author.id)}
                        onMouseDown={(e) => {
                          if (e.button === 1) {
                            handleNameClick(e, question.author.id);
                          }
                        }}
                      >
                        {question.userInfo?.name || question.author.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: '0.9rem' }}>
                        {question.title}
                      </Typography>
                    </Box>
                  }
                  secondary={question.content.substring(0, 60) + '...'}
                  secondaryTypographyProps={{ 
                    color: theme.palette.text.secondary,
                    sx: { fontSize: '0.75rem', mt: 0.5 }
                  }}
                />
              </QuestionItem>
            ))}
          </List>
        )}
      </Box>
    </StyledPopover>
  );
};

export default RelatedQuestionsPopover;

