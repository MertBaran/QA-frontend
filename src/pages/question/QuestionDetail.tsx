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
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  Comment,
  Visibility,
  ArrowBack,
  Send,
  Edit,
  Delete,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from '../../components/layout/Layout';
import { Question } from '../../types/question';
import { Answer } from '../../types/answer';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import { useAppSelector } from '../../store/hooks';
import logger from '../../utils/logger';
import { t } from '../../utils/translations';
import BookmarkButton from '../../components/ui/BookmarkButton';

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
  const { user } = useAppSelector(state => state.auth);
  const { currentLanguage } = useAppSelector(state => state.language);
  
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAnswer, setNewAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerValidationError, setAnswerValidationError] = useState<string>('');
  const [highlightedAnswerId, setHighlightedAnswerId] = useState<string | null>(null);

  // Soru ve cevapları yükle
  useEffect(() => {
    const loadQuestionData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Soru ve cevapları paralel olarak yükle
        const [questionData, answersData] = await Promise.all([
          questionService.getQuestionById(id),
          answerService.getAnswersByQuestion(id)
        ]);
        
        if (questionData) {
          setQuestion(questionData);
        } else {
          setError('Soru bulunamadı');
        }
        
        setAnswers(answersData);
        
        logger.user.action('question_detail_loaded', { questionId: id });
      } catch (err) {
        console.error('Soru detayı yüklenirken hata:', err);
        setError('Soru yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadQuestionData();
  }, [id]);

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
      
      const answer = await answerService.createAnswer(id, { content: newAnswer });
      
      if (answer) {
        setAnswers(prev => [answer, ...prev]);
        setNewAnswer('');
        setAnswerValidationError('');
        logger.user.action('answer_submitted', { questionId: id });
      }
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
    if (!id || !user) return;
    
    try {
      const success = await questionService.likeQuestion(id);
      if (success && question) {
        setQuestion(prev => prev ? {
          ...prev,
          likes: prev.likes + 1
        } : null);
      }
    } catch (err) {
      console.error('Soru beğenilirken hata:', err);
    }
  };

  // Soru beğenmeyi kaldır
  const handleUnlikeQuestion = async () => {
    if (!id || !user) return;
    
    try {
      const success = await questionService.unlikeQuestion(id);
      if (success && question) {
        setQuestion(prev => prev ? {
          ...prev,
          likes: Math.max(0, prev.likes - 1)
        } : null);
      }
    } catch (err) {
      console.error('Soru beğenisi kaldırılırken hata:', err);
    }
  };

  // Cevap beğen/beğenme
  const handleLikeAnswer = async (answerId: string) => {
    try {
      const success = await answerService.likeAnswer(answerId, id!);
      if (success) {
        setAnswers(prev => prev.map(answer => 
          answer.id === answerId 
            ? { ...answer, likes: answer.likes + 1 }
            : answer
        ));
      }
    } catch (err) {
      console.error('Cevap beğenilirken hata:', err);
    }
  };

  // Cevap beğenmeyi kaldır
  const handleUnlikeAnswer = async (answerId: string) => {
    try {
      const success = await answerService.unlikeAnswer(answerId, id!);
      if (success) {
        setAnswers(prev => prev.map(answer => 
          answer.id === answerId 
            ? { ...answer, likes: Math.max(0, answer.likes - 1) }
            : answer
        ));
      }
    } catch (err) {
      console.error('Cevap beğenisi kaldırılırken hata:', err);
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
    const previousAnswers = [...answers];
    setAnswers(prev => prev.filter(answer => answer.id !== answerId));
    
    try {
      await answerService.deleteAnswer(answerId, id!);
      // Success - state already updated
    } catch (error) {
      // Rollback on error
      console.error('Cevap silinirken hata:', error);
      setAnswers(previousAnswers);
      alert(t('delete_failed', currentLanguage));
    }
  };

  if (loading) {
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
                  mb: 3,
                  color: 'white',
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ThumbUp sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                    {question.likes}
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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                onClick={question.likes > 0 ? handleUnlikeQuestion : handleLikeQuestion}
                sx={{ 
                  color: question.likes > 0 ? '#FFB800' : 'rgba(255,255,255,0.7)',
                  '&:hover': {
                    color: question.likes > 0 ? '#FF8F00' : '#FFB800',
                  }
                }}
              >
                {question.likes > 0 ? <ThumbUp /> : <ThumbUpOutlined />}
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
                        onClick={() =>
                          answer.likes > 0
                            ? handleUnlikeAnswer(answer.id)
                            : handleLikeAnswer(answer.id)
                        }
                        sx={{
                          color: answer.likes > 0 ? '#FFB800' : 'rgba(255,255,255,0.7)',
                          '&:hover': {
                            color: answer.likes > 0 ? '#FF8F00' : '#FFB800',
                          },
                        }}
                      >
                        {answer.likes > 0 ? <ThumbUp /> : <ThumbUpOutlined />}
                      </IconButton>
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
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <ThumbUp sx={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                      {answer.likes}
                    </span>
                  </Box>
                </CardContent>
              </AnswerCard>
            ))
          )}
        </Box>
      </Container>
    </Layout>
  );
};

export default QuestionDetail; 