import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, TextField, InputAdornment, Card, CardContent, Avatar, Chip, IconButton } from '@mui/material';
import { Search, Add, ThumbUp, ThumbUpOutlined, Comment, Visibility } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { getAllQuestions, likeQuestion, undoLikeQuestion } from '../../store/questions/questionThunks';
import { clearError } from '../../store/questions/questionSlice';
import Layout from '../../components/layout/Layout';
import { QuestionsListSkeleton } from '../../components/ui/Skeleton';
import { ErrorAlert } from '../../components/error/ErrorDisplay';
import { handleError } from '../../utils/errorHandling/enhancedErrorHandler';
import logger from '../../utils/logger';

const Questions = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { questions, loading, error } = useAppSelector(state => state.questions);
  const { user } = useAppSelector(state => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredQuestions, setFilteredQuestions] = useState([]);

  // Load questions on component mount
  useEffect(() => {
    loadQuestions();
  }, []);

  // Filter questions based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(question =>
        question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        question.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredQuestions(filtered);
    }
  }, [searchTerm, questions]);

  const loadQuestions = async () => {
    try {
      await dispatch(getAllQuestions()).unwrap();
      logger.user.action('questions_loaded_successfully');
    } catch (error) {
      const errorInfo = await handleError(error, { action: 'loadQuestions' });
      logger.error('Failed to load questions', errorInfo);
    }
  };

  const handleLikeQuestion = async (questionId) => {
    try {
      const question = questions.find(q => q._id === questionId);
      const isLiked = question.likes.includes(user._id);
      
      if (isLiked) {
        await dispatch(undoLikeQuestion(questionId)).unwrap();
      } else {
        await dispatch(likeQuestion(questionId)).unwrap();
      }
    } catch (error) {
      const errorInfo = await handleError(error, { 
        action: 'likeQuestion', 
        questionId 
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const truncateText = (text, maxLength = 150) => {
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
                {searchTerm ? 'Arama sonucu bulunamadı' : 'Henüz soru bulunmuyor'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {searchTerm 
                  ? 'Farklı anahtar kelimeler deneyin.'
                  : 'İlk soruyu sormak için yukarıdaki butona tıklayın.'
                }
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
              {filteredQuestions.map((question) => {
                const isLiked = user && question.likes.includes(user._id);
                const likeCount = question.likes.length;
                const answerCount = question.answers.length;

                return (
                  <Card key={question._id} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      {/* User Avatar */}
                      <Avatar sx={{ width: 40, height: 40 }}>
                        {question.user?.name?.charAt(0) || 'U'}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        {/* Question Title */}
                        <Typography 
                          variant="h6" 
                          gutterBottom
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main' }
                          }}
                          onClick={() => navigate(`/questions/${question._id}`)}
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
                        
                        {/* Question Meta */}
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(question.createdAt)}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Comment fontSize="small" />
                            <Typography variant="caption">
                              {answerCount} cevap
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                          onClick={() => handleLikeQuestion(question._id)}
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
