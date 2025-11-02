import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  TextField,
  // Divider,
  Chip,
  IconButton,
  Card,
  CardContent,
  Alert,
  Badge,
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  ThumbDown,
  ThumbDownOutlined,
  Comment,
  Visibility,
  ArrowBack,
  Send,
  Edit,
  Delete,
  HelpOutline,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from '../../components/layout/Layout';
import { Question } from '../../types/question';
import { Answer } from '../../types/answer';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import logger from '../../utils/logger';
import { t } from '../../utils/translations';
import BookmarkButton from '../../components/ui/BookmarkButton';
import LikesModal from '../../components/ui/LikesModal';
import ParentInfoChip from '../../components/ui/ParentInfoChip';
import AskQuestionModal from '../../components/question/AskQuestionModal';
import RelatedQuestionsPopover from '../../components/question/RelatedQuestionsPopover';
import { openModal, closeModal } from '../../store/likes/likesSlice';
import { fetchLikedUsers } from '../../store/likes/likesThunks';
import { getAnswersByQuestion, createAnswer, likeAnswer, unlikeAnswer, deleteAnswer } from '../../store/answers/answerThunks';
import { updateAnswerInList, removeAnswerFromList } from '../../store/answers/answerSlice';

const QuestionCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(10, 26, 35, 0.98) 0%, rgba(21, 42, 53, 0.99) 100%)',
  border: '1px solid rgba(255, 184, 0, 0.2)',
  borderRadius: 16,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  color: 'white',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
}));

const AnswerCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(15, 31, 40, 0.95) 0%, rgba(26, 47, 58, 0.97) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  marginBottom: theme.spacing(2),
  color: 'white',
  backdropFilter: 'blur(8px)',
}));

const AskButtonWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  '& .hover-text': {
    position: 'absolute',
    left: '100%',
    whiteSpace: 'nowrap',
    opacity: 0,
    transition: 'all 0.3s ease-in-out',
    pointerEvents: 'none',
    marginLeft: theme.spacing(0.5),
    zIndex: 1000,
  },
  '& .hover-icon': {
    transition: 'transform 0.3s ease-in-out',
  },
  '&:hover .hover-text': {
    opacity: 1,
  },
  '&:hover .hover-icon': {
    transform: 'rotate(180deg)',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
  color: 'white',
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': {
    background: 'linear-gradient(135deg, #FF8F00 0%, #FF6B00 100%)',
  },
}));

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { currentLanguage } = useAppSelector(state => state.language);
  const { modalOpen: likesModalOpen, users: likesModalUsers } = useAppSelector(state => state.likes);
  const { answers, loading } = useAppSelector(state => state.answers);
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerValidationError, setAnswerValidationError] = useState<string>('');
  const [highlightedAnswerId, setHighlightedAnswerId] = useState<string | null>(null);
  
  // Parent question/answer state
  const [parentQuestion, setParentQuestion] = useState<Question | null>(null);
  const [parentAnswer, setParentAnswer] = useState<Answer | null>(null);
  const [parentAnswerQuestion, setParentAnswerQuestion] = useState<Question | null>(null);
  
  // Ask question modal states
  const [askQuestionModalOpen, setAskQuestionModalOpen] = useState(false);
  const [askQuestionMode, setAskQuestionMode] = useState<'question' | 'answer' | null>(null);
  const [targetQuestionId, setTargetQuestionId] = useState<string | null>(null);
  const [targetAnswerId, setTargetAnswerId] = useState<string | null>(null);
  
  // Related questions popover states
  const [relatedQuestionsAnchor, setRelatedQuestionsAnchor] = useState<HTMLElement | null>(null);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);
  const [loadingRelatedQuestions, setLoadingRelatedQuestions] = useState(false);
  const [currentRelatedTargetId, setCurrentRelatedTargetId] = useState<string | null>(null);
  const [currentRelatedMode, setCurrentRelatedMode] = useState<'question' | 'answer' | null>(null);
  
  // Related questions count per answer
  const [relatedQuestionsCount, setRelatedQuestionsCount] = useState<Record<string, number>>({});

  // Soru ve cevapları yükle
  useEffect(() => {
    const loadQuestionData = async () => {
      if (!id) return;
      
      try {
        setError(null);
        setLoadingQuestion(true);
        
        // Soru ve cevapları paralel olarak yükle
        const [questionData] = await Promise.all([
          questionService.getQuestionById(id),
          dispatch(getAnswersByQuestion(id))
        ]);
        
        if (questionData) {
          setQuestion(questionData);
          
          // Parent question/answer yükle
          const parentId = questionData.parentQuestionId || questionData.parentAnswerId;
          if (parentId) {
            const parentQ = await questionService.getQuestionById(parentId);
            if (parentQ) {
              setParentQuestion(parentQ);
            } else {
              const parentA = await answerService.getAnswerById(parentId);
              if (parentA) {
                setParentAnswer(parentA);
                
                // Load the question that this answer belongs to
                if (parentA.questionId) {
                  const answerQ = await questionService.getQuestionById(parentA.questionId);
                  if (answerQ) {
                    setParentAnswerQuestion(answerQ);
                  }
                }
              }
            }
          }
        } else {
          setError('Soru bulunamadı');
        }
        
        logger.user.action('question_detail_loaded', { questionId: id });
      } catch (err) {
        console.error('Soru detayı yüklenirken hata:', err);
        setError('Soru yüklenirken bir hata oluştu');
      } finally {
        setLoadingQuestion(false);
      }
    };

    loadQuestionData();
  }, [id, dispatch]);

  // Load related questions count for each answer
  useEffect(() => {
    const loadRelatedCounts = async () => {
      if (!answers || answers.length === 0) return;
      
      const counts: Record<string, number> = {};
      for (const answer of answers) {
        try {
          const related = await questionService.getQuestionsByParent(answer.id);
          counts[answer.id] = related.length;
        } catch (err) {
          console.error('Related questions count hatası:', err);
          counts[answer.id] = 0;
        }
      }
      setRelatedQuestionsCount(counts);
    };
    
    loadRelatedCounts();
  }, [answers]);

  // Hash'ten cevap ID'sini al ve highlight et
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#answer-')) {
      const answerId = hash.substring('#answer-'.length);
      setHighlightedAnswerId(answerId);
      
      // Scroll to answer
      setTimeout(() => {
        const element = document.getElementById(`answer-${answerId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Remove highlight after animation
          setTimeout(() => {
            setHighlightedAnswerId(null);
            window.history.replaceState(null, '', window.location.pathname);
          }, 3000);
        }
      }, 100);
    }
  }, [answers, id]);

  // Cevap gönder
  const handleSubmitAnswer = async () => {
    if (!id || !newAnswer.trim() || !user) return;
    
    try {
      setSubmittingAnswer(true);
      setAnswerValidationError('');
      
      await dispatch(createAnswer({ questionId: id, answerData: { content: newAnswer } }));
      
      setNewAnswer('');
      setAnswerValidationError('');
      logger.user.action('answer_submitted', { questionId: id });
    } catch (err: any) {
      console.error('Cevap gönderilirken hata:', err);
      
      // Backend'den gelen validasyon hatalarını işle
      if (err.response?.data?.errors) {
        const contentError = err.response.data.errors.find((error: any) => 
          error.path && error.path[0] === 'content'
        );
        if (contentError) {
          let message = contentError.message;
          if (message.includes('Too small')) {
            message = 'Cevap en az 5 karakter olmalıdır';
          } else if (message.includes('Required')) {
            message = 'Cevap gereklidir';
          }
          setAnswerValidationError(message);
        }
      } else if (err.response?.data?.error) {
        setAnswerValidationError(err.response.data.error);
      } else {
        setAnswerValidationError('Cevap gönderilirken bir hata oluştu');
      }
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Soru beğen/beğenme
  const handleLikeQuestion = async () => {
    if (!id || !user || !question) return;
    
    // Optimistic update
    const previousQuestion = { ...question };
    setQuestion(prev => prev ? {
      ...prev,
      likesCount: prev.likesCount + 1,
      likedByUsers: [...prev.likedByUsers, user.id],
      // Remove from dislikes if exists
      dislikesCount: prev.dislikedByUsers.includes(user.id) ? Math.max(0, prev.dislikesCount - 1) : prev.dislikesCount,
      dislikedByUsers: prev.dislikedByUsers.filter(id => id !== user.id)
    } : null);
    
    try {
      const success = await questionService.likeQuestion(id);
      if (!success) {
        // Revert on failure
        setQuestion(previousQuestion);
      }
    } catch (err) {
      console.error('Soru beğenilirken hata:', err);
      // Revert on error
      setQuestion(previousQuestion);
    }
  };

  // Soru beğenmeyi kaldır
  const handleUnlikeQuestion = async () => {
    if (!id || !user || !question) return;
    
    // Optimistic update
    const previousQuestion = { ...question };
    setQuestion(prev => prev ? {
      ...prev,
      likesCount: Math.max(0, prev.likesCount - 1),
      likedByUsers: prev.likedByUsers.filter(id => id !== user.id)
    } : null);
    
    try {
      const success = await questionService.unlikeQuestion(id);
      if (!success) {
        // Revert on failure
        setQuestion(previousQuestion);
      }
    } catch (err) {
      console.error('Soru beğenisi kaldırılırken hata:', err);
      // Revert on error
      setQuestion(previousQuestion);
    }
  };

  // Soru beğenmeme
  const handleDislikeQuestion = async () => {
    if (!id || !user || !question) return;
    
    // Optimistic update
    const previousQuestion = { ...question };
    setQuestion(prev => prev ? {
      ...prev,
      dislikesCount: prev.dislikesCount + 1,
      dislikedByUsers: [...prev.dislikedByUsers, user.id],
      // Remove from likes if exists
      likesCount: prev.likedByUsers.includes(user.id) ? Math.max(0, prev.likesCount - 1) : prev.likesCount,
      likedByUsers: prev.likedByUsers.filter(id => id !== user.id)
    } : null);
    
    try {
      const success = await questionService.dislikeQuestion(id);
      if (!success) {
        // Revert on failure
        setQuestion(previousQuestion);
      }
    } catch (err) {
      console.error('Soru beğenilmeme hatası:', err);
      // Revert on error
      setQuestion(previousQuestion);
    }
  };

  // Soru beğenmemeyi kaldır
  const handleUndoDislikeQuestion = async () => {
    if (!id || !user || !question) return;
    
    // Optimistic update
    const previousQuestion = { ...question };
    setQuestion(prev => prev ? {
      ...prev,
      dislikesCount: Math.max(0, prev.dislikesCount - 1),
      dislikedByUsers: prev.dislikedByUsers.filter(id => id !== user.id)
    } : null);
    
    try {
      const success = await questionService.undoDislikeQuestion(id);
      if (!success) {
        // Revert on failure
        setQuestion(previousQuestion);
      }
    } catch (err) {
      console.error('Soru beğenmemeyi geri alırken hata:', err);
      // Revert on error
      setQuestion(previousQuestion);
    }
  };

  // Cevap beğen/beğenme
  const handleLikeAnswer = async (answerId: string) => {
    if (!user) return;
    
    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;
    
    // Optimistic update
    const previousAnswer = { ...answer };
    dispatch(updateAnswerInList({
      answerId,
      updates: {
        likesCount: answer.likesCount + 1,
        likedByUsers: [...answer.likedByUsers, user.id],
        // Remove from dislikes if exists
        dislikesCount: answer.dislikedByUsers.includes(user.id) ? Math.max(0, answer.dislikesCount - 1) : answer.dislikesCount,
        dislikedByUsers: answer.dislikedByUsers.filter(id => id !== user.id)
      }
    }));
    
    try {
      const success = await dispatch(likeAnswer({ answerId, questionId: id! }));
      if (!success) {
        // Revert on failure
        dispatch(updateAnswerInList({
          answerId,
          updates: previousAnswer
        }));
      }
    } catch (err) {
      // Revert on error
      dispatch(updateAnswerInList({
        answerId,
        updates: previousAnswer
      }));
    }
  };

  // Cevap beğenmeyi kaldır
  const handleUnlikeAnswer = async (answerId: string) => {
    if (!user) return;
    
    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;
    
    // Optimistic update
    const previousAnswer = { ...answer };
    dispatch(updateAnswerInList({
      answerId,
      updates: {
        likesCount: Math.max(0, answer.likesCount - 1),
        likedByUsers: answer.likedByUsers.filter(id => id !== user.id)
      }
    }));
    
    try {
      const success = await dispatch(unlikeAnswer({ answerId, questionId: id! }));
      if (!success) {
        // Revert on failure
        dispatch(updateAnswerInList({
          answerId,
          updates: previousAnswer
        }));
      }
    } catch (err) {
      console.error('Cevap beğenisi kaldırılırken hata:', err);
      // Revert on error
      dispatch(updateAnswerInList({
        answerId,
        updates: previousAnswer
      }));
    }
  };

  // Cevap beğenmeme
  const handleDislikeAnswer = async (answerId: string) => {
    if (!user) return;
    
    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;
    
    // Optimistic update
    const previousAnswer = { ...answer };
    dispatch(updateAnswerInList({
      answerId,
      updates: {
        dislikesCount: answer.dislikesCount + 1,
        dislikedByUsers: [...answer.dislikedByUsers, user.id],
        // Remove from likes if exists
        likesCount: answer.likedByUsers.includes(user.id) ? Math.max(0, answer.likesCount - 1) : answer.likesCount,
        likedByUsers: answer.likedByUsers.filter(id => id !== user.id)
      }
    }));
    
    try {
      const success = await answerService.dislikeAnswer(answerId, id!);
      if (!success) {
        // Revert on failure
        dispatch(updateAnswerInList({
          answerId,
          updates: previousAnswer
        }));
      }
    } catch (err) {
      console.error('Cevap beğenilmeme hatası:', err);
      // Revert on error
      dispatch(updateAnswerInList({
        answerId,
        updates: previousAnswer
      }));
    }
  };

  // Cevap beğenmemeyi kaldır
  const handleUndoDislikeAnswer = async (answerId: string) => {
    if (!user) return;
    
    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;
    
    // Optimistic update
    const previousAnswer = { ...answer };
    dispatch(updateAnswerInList({
      answerId,
      updates: {
        dislikesCount: Math.max(0, answer.dislikesCount - 1),
        dislikedByUsers: answer.dislikedByUsers.filter(id => id !== user.id)
      }
    }));
    
    try {
      const success = await answerService.undoDislikeAnswer(answerId, id!);
      if (!success) {
        // Revert on failure
        dispatch(updateAnswerInList({
          answerId,
          updates: previousAnswer
        }));
      }
    } catch (err) {
      console.error('Cevap beğenmemeyi geri alırken hata:', err);
      // Revert on error
      dispatch(updateAnswerInList({
        answerId,
        updates: previousAnswer
      }));
    }
  };

  // Soru sil
  const handleDeleteQuestion = async () => {
    if (!id) return;
    
    const { confirmService } = await import('../../services/confirmService');
    const confirmed = await confirmService.confirmDelete(undefined, currentLanguage);
    
    if (!confirmed) {
      return;
    }
    
    try {
      await questionService.deleteQuestion(id);
      navigate('/');
    } catch (error) {
      console.error('Soru silinirken hata:', error);
      alert(t('delete_failed', currentLanguage));
    }
  };

  // Cevap sil
  const handleDeleteAnswer = async (answerId: string) => {
    if (!id) return;
    
    const { confirmService } = await import('../../services/confirmService');
    const confirmed = await confirmService.confirmDelete(undefined, currentLanguage);
    
    if (!confirmed) {
      return;
    }
    
    // Optimistic update: UI'dan hemen sil
    dispatch(removeAnswerFromList(answerId));
    
    try {
      await dispatch(deleteAnswer({ answerId, questionId: id! }));
    } catch (error) {
      // Rollback on error - re-fetch answers
      console.error('Cevap silinirken hata:', error);
      dispatch(getAnswersByQuestion(id!));
      alert(t('delete_failed', currentLanguage));
    }
  };

  // Ask question about question/answer handlers
  const handleAskQuestionAboutQuestion = () => {
    if (!question) return;
    setAskQuestionMode('question');
    setTargetQuestionId(question.id);
    setAskQuestionModalOpen(true);
  };

  const handleAskQuestionAboutAnswer = (answerId: string) => {
    setAskQuestionMode('answer');
    setTargetAnswerId(answerId);
    setAskQuestionModalOpen(true);
  };

  const handleSubmitRelatedQuestion = async (data: any) => {
    if (!user) return;
    
    const questionData = {
      ...data,
      parentFormId: askQuestionMode === 'question' ? targetQuestionId : targetAnswerId,
    };

    const newQuestion = await questionService.createQuestion(questionData);
    // Navigate to the newly created question
    if (newQuestion) {
      navigate(`/questions/${newQuestion.id}`);
    }
  };

  // Related questions handlers
  const handleShowRelatedQuestions = async (event: React.MouseEvent<HTMLElement>, targetId: string, mode: 'question' | 'answer') => {
    setRelatedQuestionsAnchor(event.currentTarget);
    setCurrentRelatedTargetId(targetId);
    setCurrentRelatedMode(mode);
    setLoadingRelatedQuestions(true);
    
    try {
      const questions = await questionService.getQuestionsByParent(targetId);
      setRelatedQuestions(questions);
    } catch (error) {
      console.error('İlişkili sorular yüklenirken hata:', error);
      setRelatedQuestions([]);
    } finally {
      setLoadingRelatedQuestions(false);
    }
  };

  const handleCloseRelatedQuestionsPopover = () => {
    setRelatedQuestionsAnchor(null);
  };

  const handleRelatedQuestionClick = (questionId: string) => {
    // Navigate to the clicked question
    navigate(`/questions/${questionId}`);
    setRelatedQuestionsAnchor(null);
  };

  if (loadingQuestion) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: 'white' }}>
              {t('loading', currentLanguage)}
            </Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  if (error || !question) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || t('question_not_found', currentLanguage)}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ color: 'white', borderColor: 'white' }}
          >
                      {t('back', currentLanguage)}
        </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
        {/* Geri Dön Butonu */}
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ 
            mb: 3, 
            color: 'white', 
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: 'white',
              background: 'rgba(255,255,255,0.1)',
            }
          }}
        >
          {t('back', currentLanguage)}
        </Button>

        {/* Soru Detayı */}
        <QuestionCard>
          {/* Parent Question/Answer Info */}
          {(question.parentQuestionId || question.parentAnswerId) && (() => {
            const parentId = question.parentQuestionId || question.parentAnswerId;
            
            return (
              <ParentInfoChip 
                parentQuestion={parentQuestion}
                parentAnswer={parentAnswer}
                parentId={parentId!}
                parentAnswerQuestion={parentAnswerQuestion}
              />
            );
          })()}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              {/* Yazar Bilgisi */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar 
                  src={question.userInfo?.profile_image || question.author.avatar} 
                  sx={{ 
                    width: 40, 
                    height: 40,
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}
                  onClick={() => navigate(`/profile/${question.author.id}`)}
                />
                <Box>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': { color: 'rgba(255,184,0,0.8)' }
                    }}
                    onClick={() => navigate(`/profile/${question.author.id}`)}
                  >
                    {question.userInfo?.name || question.author.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {question.timeAgo}
                  </Typography>
              </Box>
            </Box>

              {/* Kategori */}
              <Box sx={{ mb: 2 }}>
                <Chip 
                  label={question.category} 
                  size="small" 
                  sx={{ 
                    bgcolor: 'rgba(255,184,0,0.2)', 
                    color: 'rgba(255,184,0,0.9)',
                    fontSize: '0.75rem',
                  }} 
                />
              </Box>

              {/* Soru Başlığı */}
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  flex: 1,
                  color: 'white',
                  mb: 3,
                }}
              >
                {question.title}
              </Typography>

              {/* Soru İçeriği */}
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 4, 
                  lineHeight: 1.8, 
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '1.1rem',
                }}
              >
                {question.content}
              </Typography>

              {/* Tag'ler */}
              {question.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  {question.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        borderRadius: 2,
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        bgcolor: 'rgba(255,255,255,0.08)',
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* İstatistikler */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box 
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  onClick={async () => {
                    if (question.likesCount > 0 && question.likedByUsers.length > 0) {
                      try {
                        await dispatch(fetchLikedUsers(question.likedByUsers));
                        dispatch(openModal());
                      } catch (err) {
                        console.error('Kullanıcılar yüklenirken hata:', err);
                      }
                    }
                  }}
                >
                  <ThumbUp sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', cursor: question.likesCount > 0 ? 'pointer' : 'default' }} />
                  <span 
                    style={{ 
                      color: 'rgba(255,255,255,0.8)', 
                      fontSize: 14,
                      cursor: question.likesCount > 0 ? 'pointer' : 'default'
                    }}
                  >
                    {question.likesCount}
                  </span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Comment sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                    {answers.length}
                  </span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Visibility sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                    {question.views}
                  </span>
                </Box>
              </Box>
            </Box>

            {/* Aksiyon Butonları */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              {user && (
                <AskButtonWrapper onClick={handleAskQuestionAboutQuestion}>
                  <IconButton
                    className="hover-icon"
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      '&:hover': { color: '#FFB800' },
                    }}
                  >
                    <HelpOutline />
                  </IconButton>
                  <Typography 
                    className="hover-text"
                    variant="caption"
                    sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      fontSize: '0.75rem',
                    }}
                  >
                    {t('ask_question', currentLanguage)}
                  </Typography>
                </AskButtonWrapper>
              )}
              <BookmarkButton 
                targetType={"question"}
                targetId={question.id}
                targetData={{
                  title: question.title,
                  content: question.content,
                  author: question.author?.name,
                  authorId: question.author?.id,
                  created_at: question.createdAt,
                  url: window.location.origin + '/questions/' + question.id,
                }}
              />
              <IconButton 
                onClick={question.likedByUsers.includes(user?.id || '') ? handleUnlikeQuestion : handleLikeQuestion}
                sx={{ 
                  color: question.likedByUsers.includes(user?.id || '') ? '#FFB800' : 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: question.likedByUsers.includes(user?.id || '') ? '#FF8F00' : '#FFB800',
                  }
                }}
              >
                {question.likedByUsers.includes(user?.id || '') ? <ThumbUp /> : <ThumbUpOutlined />}
              </IconButton>
              <IconButton 
                onClick={question.dislikedByUsers.includes(user?.id || '') ? handleUndoDislikeQuestion : handleDislikeQuestion}
                sx={{ 
                  color: question.dislikedByUsers.includes(user?.id || '') ? '#FF6B6B' : 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: question.dislikedByUsers.includes(user?.id || '') ? '#FF5252' : '#FF6B6B',
                  }
                }}
              >
                {question.dislikedByUsers.includes(user?.id || '') ? <ThumbDown /> : <ThumbDownOutlined />}
              </IconButton>
              {user && (
                question.author.id === user.id || 
                question.userInfo?._id === user.id ||
                question.author.id === user.id?.toString()
              ) && (
                <IconButton 
                  sx={{ 
                    color: 'rgba(255,80,80,0.8)',
                    '&:hover': {
                      color: 'rgba(255,80,80,1)',
                    }
                  }}
                  onClick={handleDeleteQuestion}
                  title={t('delete', currentLanguage)}
                >
                  <Delete />
                </IconButton>
              )}
            </Box>
          </Box>
        </QuestionCard>

        {/* Cevap Yazma Bölümü */}
        {user && (
          <QuestionCard>
            <Typography variant="h6" sx={{ mb: 2, color: 'white' }}>
              {t('write_answer', currentLanguage)}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
              * {t('validation_answer_min', currentLanguage)} (Enter ile gönder, Shift+Enter yeni satır)
            </Typography>
            <TextField
              multiline
              rows={4}
              fullWidth
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !submittingAnswer && newAnswer.trim()) {
                  e.preventDefault();
                  handleSubmitAnswer();
                }
              }}
              placeholder={t('answer_placeholder', currentLanguage)}
              variant="outlined"
              disabled={submittingAnswer}
              error={!!answerValidationError}
              helperText={answerValidationError}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { 
                    borderColor: answerValidationError ? '#f44336' : 'rgba(255,255,255,0.3)' 
                  },
                  '&:hover fieldset': { 
                    borderColor: answerValidationError ? '#f44336' : 'rgba(255,184,0,0.5)' 
                  },
                  '&.Mui-focused fieldset': { 
                    borderColor: answerValidationError ? '#f44336' : 'rgba(255,184,0,0.8)' 
                  },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                },
              }}
            />
            <ActionButton
              onClick={handleSubmitAnswer}
              disabled={!newAnswer.trim() || submittingAnswer}
              endIcon={<Send />}
            >
              {submittingAnswer ? t('sending', currentLanguage) : t('send_answer', currentLanguage)}
            </ActionButton>
          </QuestionCard>
        )}

        {/* Cevaplar */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, color: 'white', fontWeight: 600 }}>
            {t('answers', currentLanguage)} ({answers.length})
          </Typography>
          
          {answers.length === 0 ? (
            <QuestionCard>
              <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                {t('no_answers', currentLanguage)}
              </Typography>
            </QuestionCard>
            ) : (
            answers.map((answer) => (
              <AnswerCard 
                key={answer.id}
                id={`answer-${answer.id}`}
                sx={{
                  border: highlightedAnswerId === answer.id ? '2px solid #FFB800' : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: highlightedAnswerId === answer.id ? '0 0 20px rgba(255, 184, 0, 0.5)' : 'none',
                  transition: 'all 0.3s ease-in-out',
                  animation: highlightedAnswerId === answer.id ? 'pulse 0.5s ease-in-out' : 'none',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.02)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={answer.userInfo?.profile_image || answer.author.avatar} 
                        sx={{ 
                          width: 32, 
                          height: 32,
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.8 }
                        }}
                        onClick={() => navigate(`/profile/${answer.author.id}`)}
                      />
                      <Box>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            color: 'white', 
                            fontWeight: 600,
                            cursor: 'pointer',
                            '&:hover': { color: 'rgba(255,184,0,0.8)' }
                          }}
                          onClick={() => navigate(`/profile/${answer.author.id}`)}
                        >
                          {answer.userInfo?.name || answer.author.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {answer.timeAgo}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Bookmark for Answer (sağ üst, like ile yan yana) */}
                      <BookmarkButton
                        targetType={"answer"}
                        targetId={answer.id}
                        targetData={{
                          title: question.title,
                          content: answer.content,
                          author: answer.author?.name,
                          authorId: answer.author?.id,
                          created_at: answer.createdAt,
                          url:
                            window.location.origin +
                            '/questions/' +
                            question.id +
                            '#answer-' +
                            answer.id,
                        }}
                      />
                      {user && (
                        answer.author.id === user.id || 
                        answer.userInfo?._id === user.id ||
                        answer.author.id === user.id?.toString()
                      ) && (
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAnswer(answer.id);
                          }}
                          sx={{
                            color: 'rgba(255,80,80,0.8)',
                            '&:hover': {
                              color: 'rgba(255,80,80,1)',
                            },
                          }}
                          title={t('delete', currentLanguage)}
                        >
                          <Delete />
                        </IconButton>
                      )}
                      <IconButton
                        onClick={() => {
                          const isLiked = answer.likedByUsers.includes(user?.id || '');
                          isLiked ? handleUnlikeAnswer(answer.id) : handleLikeAnswer(answer.id);
                        }}
                        sx={{
                          color: answer.likedByUsers.includes(user?.id || '') ? '#FFB800' : 'rgba(255,255,255,0.7)',
                          '&:hover': {
                            color: answer.likedByUsers.includes(user?.id || '') ? '#FF8F00' : '#FFB800',
                          },
                        }}
                      >
                        {answer.likedByUsers.includes(user?.id || '') ? <ThumbUp /> : <ThumbUpOutlined />}
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          const isDisliked = answer.dislikedByUsers.includes(user?.id || '');
                          isDisliked ? handleUndoDislikeAnswer(answer.id) : handleDislikeAnswer(answer.id);
                        }}
                        sx={{
                          color: answer.dislikedByUsers.includes(user?.id || '') ? '#FF6B6B' : 'rgba(255,255,255,0.7)',
                          '&:hover': {
                            color: answer.dislikedByUsers.includes(user?.id || '') ? '#FF5252' : '#FF6B6B',
                          },
                        }}
                      >
                        {answer.dislikedByUsers.includes(user?.id || '') ? <ThumbDown /> : <ThumbDownOutlined />}
                      </IconButton>
                      {user && (
                        <>
                          <AskButtonWrapper onClick={() => handleAskQuestionAboutAnswer(answer.id)}>
                            <IconButton
                              className="hover-icon"
                              sx={{
                                color: 'rgba(255,255,255,0.7)',
                                '&:hover': { color: '#FFB800' },
                              }}
                            >
                              <HelpOutline />
                            </IconButton>
                            <Typography 
                              className="hover-text"
                              variant="caption"
                              sx={{ 
                                color: 'rgba(255,255,255,0.8)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                fontSize: '0.75rem',
                              }}
                            >
                              {t('ask_question', currentLanguage)}
                            </Typography>
                          </AskButtonWrapper>
                          <Badge
                            badgeContent={relatedQuestionsCount[answer.id] || 0}
                            color="primary"
                            sx={{
                              '& .MuiBadge-badge': {
                                bgcolor: '#FFB800',
                                color: 'rgba(10,26,35,0.98)',
                              }
                            }}
                          >
                            <IconButton
                              onClick={(e) => handleShowRelatedQuestions(e, answer.id, 'answer')}
                              sx={{
                                color: 'rgba(255,255,255,0.7)',
                                '&:hover': { color: '#FFB800' },
                              }}
                              title={t('related_questions', currentLanguage)}
                            >
                              <Comment fontSize="small" />
                            </IconButton>
                          </Badge>
                        </>
                      )}
                    </Box>
                  </Box>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.9)',
                      lineHeight: 1.6,
                    }}
                  >
                    {answer.content}
                  </Typography>
                  
                  <Box 
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}
                    onClick={async () => {
                      if (answer.likesCount > 0 && answer.likedByUsers.length > 0) {
                        try {
                          await dispatch(fetchLikedUsers(answer.likedByUsers));
                          dispatch(openModal());
                        } catch (err) {
                          console.error('Kullanıcılar yüklenirken hata:', err);
                        }
                      }
                    }}
                  >
                    <ThumbUp sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', cursor: answer.likesCount > 0 ? 'pointer' : 'default' }} />
                    <span 
                      style={{ 
                        color: 'rgba(255,255,255,0.8)', 
                        fontSize: 12,
                        cursor: answer.likesCount > 0 ? 'pointer' : 'default'
                      }}
                    >
                      {answer.likesCount}
                    </span>
                  </Box>
                </CardContent>
              </AnswerCard>
            ))
          )}
        </Box>
      </Container>
      
      {/* Likes Modal */}
      <LikesModal 
        open={likesModalOpen}
        onClose={() => dispatch(closeModal())}
        users={likesModalUsers}
      />

      {/* Ask Question Modal */}
      <AskQuestionModal
        open={askQuestionModalOpen}
        onClose={() => setAskQuestionModalOpen(false)}
        onSubmit={handleSubmitRelatedQuestion}
        aboutQuestion={askQuestionMode === 'question' && targetQuestionId && question ? { id: targetQuestionId, title: question.title } : undefined}
        aboutAnswer={askQuestionMode === 'answer' && targetAnswerId ? { id: targetAnswerId, content: answers.find(a => a.id === targetAnswerId)?.content || '' } : undefined}
        title={askQuestionMode === 'question' ? t('ask_question_about_question', currentLanguage) : t('ask_question_about_answer', currentLanguage)}
      />

      {/* Related Questions Popover */}
      <RelatedQuestionsPopover
        anchorEl={relatedQuestionsAnchor}
        onClose={handleCloseRelatedQuestionsPopover}
        questions={relatedQuestions}
        loading={loadingRelatedQuestions}
        onQuestionClick={handleRelatedQuestionClick}
      />
    </Layout>
  );
};

export default QuestionDetail; 