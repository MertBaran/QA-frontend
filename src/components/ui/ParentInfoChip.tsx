import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip, Box, Avatar, Typography } from '@mui/material';
import { KeyboardArrowRight } from '@mui/icons-material';
import { Question } from '../../types/question';
import { Answer } from '../../types/answer';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';

interface ParentInfoChipProps {
  parentQuestion?: Question | null;
  parentAnswer?: Answer | null;
  parentId?: string;
  parentAnswerQuestion?: Question | null;
}

const ParentInfoChip: React.FC<ParentInfoChipProps> = ({
  parentQuestion,
  parentAnswer,
  parentId,
  parentAnswerQuestion,
}) => {
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector(state => state.language);

  if (!parentId) return null;

  const isAnswer = !!parentAnswer;

  const handleProfileNavigation = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    
    // Ctrl/Cmd + click veya middle click için yeni sekme
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      window.open(`/profile/${userId}`, '_blank');
      return;
    }

    navigate(`/profile/${userId}`);
  };

  const handleChipNavigation = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Ctrl/Cmd + click veya middle click için yeni sekme
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      const url = isAnswer && parentAnswer 
        ? `/questions/${parentAnswer.questionId}#answer-${parentId}`
        : `/questions/${parentId}`;
      window.open(url, '_blank');
      return;
    }

    if (isAnswer && parentAnswer) {
      navigate(`/questions/${parentAnswer.questionId}#answer-${parentId}`);
    } else {
      navigate(`/questions/${parentId}`);
    }
  };

  const chipSx = {
    mb: 2,
    bgcolor: 'rgba(255,184,0,0.1)',
    color: 'rgba(255,184,0,0.9)',
    border: '1px solid rgba(255,184,0,0.3)',
    cursor: 'pointer',
    height: 'auto',
    py: 0.5,
    '&:hover': {
      bgcolor: 'rgba(255,184,0,0.2)',
    },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: 'fit-content' }}>
      {parentQuestion ? (
        <Chip
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar 
                src={parentQuestion.userInfo?.profile_image || parentQuestion.author.avatar} 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.7, transform: 'scale(1.1)' },
                  transition: 'all 0.2s ease'
                }}
                onClick={(e) => handleProfileNavigation(e, parentQuestion.author.id)}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    handleProfileNavigation(e, parentQuestion.author.id);
                  }
                }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.7, textDecoration: 'underline' },
                  transition: 'all 0.2s ease'
                }}
                onClick={(e) => handleProfileNavigation(e, parentQuestion.author.id)}
                onMouseDown={(e) => {
                  if (e.button === 1) {
                    handleProfileNavigation(e, parentQuestion.author.id);
                  }
                }}
              >
                {parentQuestion.userInfo?.name || parentQuestion.author.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                • {parentQuestion.title}
              </Typography>
            </Box>
          }
          onClick={handleChipNavigation}
          onMouseDown={(e) => {
            if (e.button === 1) {
              handleChipNavigation(e);
            }
          }}
          sx={chipSx}
          icon={<KeyboardArrowRight />}
        />
      ) : parentAnswer ? (
        <Box>
          {/* Parent question info (if available) - DISABLED FOR NOW */}
          {/* {parentAnswerQuestion && (
            <Chip
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar 
                    src={parentAnswerQuestion.userInfo?.profile_image || parentAnswerQuestion.author.avatar} 
                    sx={{ 
                      width: 20, 
                      height: 20, 
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.7, transform: 'scale(1.1)' },
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => handleProfileNavigation(e, parentAnswerQuestion.author.id)}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        handleProfileNavigation(e, parentAnswerQuestion.author.id);
                      }
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.7, textDecoration: 'underline' },
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => handleProfileNavigation(e, parentAnswerQuestion.author.id)}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        handleProfileNavigation(e, parentAnswerQuestion.author.id);
                      }
                    }}
                  >
                    {parentAnswerQuestion.userInfo?.name || parentAnswerQuestion.author.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    • {parentAnswerQuestion.title}
                  </Typography>
                </Box>
              }
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.button === 1) {
                  e.preventDefault();
                  window.open(`/questions/${parentAnswerQuestion.id}`, '_blank');
                } else {
                  navigate(`/questions/${parentAnswerQuestion.id}`);
                }
              }}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  window.open(`/questions/${parentAnswerQuestion.id}`, '_blank');
                }
              }}
              sx={{
                ...chipSx,
                mb: 1,
                bgcolor: 'rgba(255,184,0,0.05)',
              }}
            />
          )}
          L-shaped connection between question and answer
          {parentAnswerQuestion && (
            <Box
              sx={{
                position: 'absolute',
                left: -20,
                top: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              Vertical line
              <Box
                sx={{
                  width: '2px',
                  height: '100%',
                  bgcolor: 'rgba(255,184,0,0.5)',
                }}
              />
            </Box>
          )} */}
          {/* Parent answer info */}
          <Chip
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar 
                  src={parentAnswer.userInfo?.profile_image || parentAnswer.author.avatar} 
                  sx={{ 
                    width: 20, 
                    height: 20, 
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.7, transform: 'scale(1.1)' },
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => handleProfileNavigation(e, parentAnswer.author.id)}
                  onMouseDown={(e) => {
                    if (e.button === 1) {
                      handleProfileNavigation(e, parentAnswer.author.id);
                    }
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.7, textDecoration: 'underline' },
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => handleProfileNavigation(e, parentAnswer.author.id)}
                  onMouseDown={(e) => {
                    if (e.button === 1) {
                      handleProfileNavigation(e, parentAnswer.author.id);
                    }
                  }}
                >
                  {parentAnswer.userInfo?.name || parentAnswer.author.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  • {parentAnswer.content.substring(0, 30)}...
                </Typography>
              </Box>
            }
            onClick={handleChipNavigation}
            onMouseDown={(e) => {
              if (e.button === 1) {
                handleChipNavigation(e);
              }
            }}
            sx={chipSx}
            icon={<KeyboardArrowRight />}
          />
        </Box>
      ) : (
        <Chip
          label={t('this_question_about', currentLanguage)}
          onClick={handleChipNavigation}
          onMouseDown={(e) => {
            if (e.button === 1) {
              handleChipNavigation(e);
            }
          }}
          sx={chipSx}
          icon={<KeyboardArrowRight />}
        />
      )}
    </Box>
  );
};

export default ParentInfoChip;

