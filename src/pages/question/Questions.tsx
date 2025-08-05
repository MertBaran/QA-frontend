import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Card,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Search,
  Add,
  ThumbUp,
  ThumbUpOutlined,
  Comment,
  Visibility,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  getAllQuestions,
  likeQuestion,
  unlikeQuestion,
} from '../../store/questions/questionThunks';
import { clearError } from '../../store/questions/questionSlice';
import Layout from '../../components/layout/Layout';
import { QuestionsListSkeleton } from '../../components/ui/Skeleton';
import { ErrorAlert } from '../../components/error/ErrorDisplay';
import { handleError } from '../../utils/errorHandling/enhancedErrorHandler';
import logger from '../../utils/logger';
import { Question } from '../../types/question';

const Questions = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { questions, loading, error } = useAppSelector(
    state => state.questions
  );
  const { user } = useAppSelector(state => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);

  const loadQuestions = useCallback(async () => {
    try {
      await dispatch(getAllQuestions()).unwrap();
      logger.user.action('questions_loaded_successfully');
    } catch (error) {
      const errorInfo = await handleError(error, { action: 'loadQuestions' });
      logger.error('Failed to load questions', errorInfo);
    }
  }, [dispatch]);

  // Load questions on component mount
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // Filter questions based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(
        (question: Question) =>
          question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          question.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQuestions(filtered);
    }
  }, [searchTerm, questions]);

  const handleLikeQuestion = async (questionId: string) => {
    try {
      const question = questions.find((q: Question) => q.id === questionId);
      if (!question) return;
      const isLiked = question.likes > 0; // Simplified for now

      if (isLiked) {
        await dispatch(unlikeQuestion(questionId)).unwrap();
      } else {
        await dispatch(likeQuestion(questionId)).unwrap();
      }
    } catch (error) {
      const errorInfo = await handleError(error, {
        action: 'likeQuestion',
        questionId,
      });
      logger.error('Failed to like/unlike question', errorInfo);
    }
  };

  const handleRetry = () => {
    dispatch(clearError());
    loadQuestions();
  };

  const handleDismissError = () => {
    dispatch(clearError());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading && questions.length === 0) {
    return (
      <Layout>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Sorular
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Tüm soruları burada görüntüleyin.
            </Typography>

            {/* Search and Add Button */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                placeholder="Sorularda ara..."
                variant="outlined"
                size="small"
                sx={{ flex: 1, maxWidth: 400 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                component={RouterLink}
                to="/ask-question"
                variant="contained"
                startIcon={<Add />}
              >
                Soru Sor
              </Button>
            </Box>
          </Box>

          {/* Skeleton Loading */}
          <QuestionsListSkeleton count={8} />
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Sorular
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Tüm soruları burada görüntüleyin.
          </Typography>

          {/* Search and Add Button */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              placeholder="Sorularda ara..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              sx={{ flex: 1, maxWidth: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              component={RouterLink}
              to="/ask-question"
              variant="contained"
              startIcon={<Add />}
            >
              Soru Sor
            </Button>
          </Box>
        </Box>

        {/* Error Display */}
        {error && (
          <ErrorAlert
            error={error}
            onRetry={handleRetry}
            onDismiss={handleDismissError}
          />
        )}

        {/* Questions List */}
        <Box>
          {filteredQuestions.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                color: 'text.secondary',
              }}
            >
              <Typography variant="h6" gutterBottom>
                {searchTerm
                  ? 'Arama sonucu bulunamadı'
                  : 'Henüz soru bulunmuyor'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {searchTerm
                  ? 'Farklı anahtar kelimeler deneyin.'
                  : 'İlk soruyu sormak için yukarıdaki butona tıklayın.'}
              </Typography>
              <Button
                component={RouterLink}
                to="/ask-question"
                variant="contained"
                startIcon={<Add />}
              >
                İlk Soruyu Sor
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredQuestions.map((question: Question) => {
                console.log('Rendering question:', question);
                const isLiked = question.likes > 0; // Simplified for now
                const likeCount = question.likes;
                const answerCount = question.answers;

                return (
                  <Card key={question.id} sx={{ p: 3 }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}
                    >
                      {/* User Avatar */}
                      <Avatar 
                        sx={{ width: 40, height: 40 }}
                        src={question.userInfo?.profile_image}
                      >
                        {question.userInfo?.name?.charAt(0) || 'U'}
                      </Avatar>

                      <Box sx={{ flex: 1 }}>
                        {/* Question Title */}
                        <Typography
                          variant="h6"
                          gutterBottom
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main' },
                          }}
                          onClick={() => navigate(`/questions/${question.id}`)}
                        >
                          {question.title}
                        </Typography>

                        {/* Question Content */}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {truncateText(question.content)}
                        </Typography>

                        {/* User Info */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {question.userInfo?.name || 'Anonim Kullanıcı'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            •
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(question.createdAt)}
                          </Typography>
                        </Box>

                        {/* Question Meta */}
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Comment fontSize="small" />
                            <Typography variant="caption">
                              {answerCount} cevap
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Visibility fontSize="small" />
                            <Typography variant="caption">
                              {likeCount} beğeni
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Like Button */}
                      {user && (
                        <IconButton
                          onClick={() => handleLikeQuestion(question.id)}
                          color={isLiked ? 'primary' : 'default'}
                          size="small"
                        >
                          {isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
                        </IconButton>
                      )}
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </Container>
    </Layout>
  );
};

export default Questions;
