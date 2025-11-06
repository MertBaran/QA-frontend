import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Chip, Box, Avatar, Typography } from '@mui/material';
import { KeyboardArrowRight } from '@mui/icons-material';
import { Question, ParentContentInfo } from '../../types/question';
import { Answer } from '../../types/answer';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import { useTheme } from '@mui/material/styles';

interface ParentInfoChipProps {
  parentQuestion?: Question | null;
  parentAnswer?: Answer | null;
  parentId?: string;
  parentAnswerQuestion?: Question | null;
  parentContentInfo?: ParentContentInfo;
}

const ParentInfoChip: React.FC<ParentInfoChipProps> = ({
  parentQuestion,
  parentAnswer,
  parentId,
  parentAnswerQuestion,
  parentContentInfo,
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { name: themeName } = useAppSelector(state => state.theme);

  if (!parentId) return null;

  // Use backend parentContentInfo if available
  const isAnswer = parentContentInfo 
    ? parentContentInfo.type === 'answer'
    : !!parentAnswer;

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
    
    // Determine URL based on parent type
    let url = `/questions/${parentId}`;
    if (isAnswer) {
      // For answers, navigate to the answer's question and highlight the answer
      const questionId = parentContentInfo?.questionId || parentAnswer?.questionId;
      if (questionId) {
        url = `/questions/${questionId}#answer-${parentId}`;
      }
    }
    
    // Ctrl/Cmd + click veya middle click için yeni sekme
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      e.preventDefault();
      window.open(url, '_blank');
      return;
    }

    navigate(url);
  };

  const chipSx = (theme: any) => {
    const isMolume = themeName === 'molume';
    const isMagnefite = themeName === 'magnefite';
    // Molume uses #5E315A (brighter #7A4A75 in dark mode), Magnefite uses gray, others use primary
    let parentColor: string;
    if (isMolume) {
      parentColor = theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A'; // Brighter purple in dark mode
    } else if (isMagnefite) {
      parentColor = theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'; // Gray for Magnefite
    } else {
      parentColor = theme.palette.primary.main;
    }
    return {
      mb: 2,
      bgcolor: `${parentColor}22`,
      color: parentColor,
      border: `1px solid ${parentColor}55`,
      cursor: 'pointer',
      height: 'auto',
      py: 0.5,
      '&:hover': {
        bgcolor: `${parentColor}33`,
      },
    };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: 'fit-content', maxWidth: '100%' }}>
      {parentContentInfo ? (
        // Use backend parentContentInfo
        <Chip
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: '100%', overflow: 'hidden' }}>
              {parentContentInfo.userInfo && (
                <>
                  <Avatar 
                    src={parentContentInfo.userInfo.profile_image} 
                    sx={{ 
                      width: 20, 
                      height: 20, 
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.7, transform: 'scale(1.1)' },
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onClick={(e) => handleProfileNavigation(e, parentContentInfo.userInfo!._id)}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        handleProfileNavigation(e, parentContentInfo.userInfo!._id);
                      }
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.7, textDecoration: 'underline' },
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onClick={(e) => handleProfileNavigation(e, parentContentInfo.userInfo!._id)}
                    onMouseDown={(e) => {
                      if (e.button === 1) {
                        handleProfileNavigation(e, parentContentInfo.userInfo!._id);
                      }
                    }}
                  >
                    {parentContentInfo.userInfo.name}
                  </Typography>
                  <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary, flexShrink: 0 })}>
                    • 
                  </Typography>
                </>
              )}
              {parentContentInfo.type === 'question' && parentContentInfo.title ? (
                <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' })}>
                  {parentContentInfo.title}
                </Typography>
              ) : parentContentInfo.type === 'answer' && parentContentInfo.questionTitle ? (
                <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' })}>
                  {parentContentInfo.questionTitle}
                </Typography>
              ) : (
                <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary })}>
                  {t('this_question_about', currentLanguage)}
                </Typography>
              )}
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
      ) : parentQuestion ? (
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
              <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary })}>
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
                <Typography variant="caption" sx={(theme) => ({ color: theme.palette.text.secondary })}>
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

