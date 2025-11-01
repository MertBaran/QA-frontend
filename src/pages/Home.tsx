import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Button,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Fade,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Pagination,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  ThumbUp,
  Comment,
  Visibility,
  Bookmark,
  Share,
  MoreVert,
  FilterList,
  Add,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Delete,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Layout from '../components/layout/Layout';
import { HomePageSkeleton } from '../components/ui/Skeleton';
import FilterModal from '../components/ui/FilterModal';
import logger from '../utils/logger';
import { 
  categories, 
  sortOptions,
  type Question,
  type QuestionFilters
} from '../types/question';
import { questionService } from '../services/questionService';
import { bookmarkService } from '../services/bookmarkService';
import { t } from '../utils/translations';
import { useAppSelector } from '../store/hooks';
import BookmarkButton from '../components/ui/BookmarkButton';

const QuestionCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(30, 58, 71, 0.95) 0%, rgba(21, 42, 53, 0.98) 100%)',
  borderRadius: 16,
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  border: '1px solid rgba(255, 184, 0, 0.15)',
  boxShadow: '0 4px 20px rgba(10, 26, 35, 0.2)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  color: 'white',
  backdropFilter: 'blur(10px)',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 32px rgba(255, 184, 0, 0.2)',
    border: '1px solid rgba(255, 184, 0, 0.3)',
    background: 'linear-gradient(135deg, rgba(30, 58, 71, 1) 0%, rgba(21, 42, 53, 1) 100%)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, #FFB800 0%, #FF8F00 50%, #FFB800 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::before': {
    opacity: 1,
  },
}));

const FilterButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
  color: 'white',
  borderRadius: 25,
  px: 3,
  py: 1.5,
  fontWeight: 600,
  boxShadow: '0 4px 20px rgba(255, 184, 0, 0.3)',
  '&:hover': {
    background: 'linear-gradient(135deg, #FFD54F 0%, #FFB800 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 25px rgba(255, 184, 0, 0.4)',
  },
  transition: 'all 0.3s ease',
}));

const ActiveFilterChip = styled(Chip)(({ theme }) => ({
  background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.2) 0%, rgba(255, 143, 0, 0.3) 100%)',
  color: 'white',
  border: '1px solid rgba(255, 184, 0, 0.4)',
  borderRadius: 8,
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.3) 0%, rgba(255, 143, 0, 0.4) 100%)',
  },
}));

const PaginationContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  padding: theme.spacing(2),
  background: 'linear-gradient(135deg, rgba(30, 58, 71, 0.95) 0%, rgba(21, 42, 53, 0.98) 100%)',
  borderRadius: 16,
  border: '1px solid rgba(255, 184, 0, 0.15)',
}));

const ItemsPerPageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  background: 'linear-gradient(135deg, rgba(30, 58, 71, 0.95) 0%, rgba(21, 42, 53, 0.98) 100%)',
  borderRadius: 12,
  border: '1px solid rgba(255, 184, 0, 0.15)',
  marginBottom: theme.spacing(2),
}));

const Home = () => {
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user } = useAppSelector(state => state.auth);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    tags: '',
    sortBy: 'En Yeni',
    savedOnly: 'false',
  });
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [createQuestionModalOpen, setCreateQuestionModalOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
  });
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    content?: string;
    category?: string;
    tags?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Backend'den paginated soruları çek
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const result = await questionService.getQuestionsPaginated({
          page: currentPage,
          limit: itemsPerPage,
          sortBy: filters.sortBy === 'En Yeni' ? 'createdAt' : 
                  filters.sortBy === 'En Popüler' ? 'likes' :
                  filters.sortBy === 'En Çok Görüntülenen' ? 'views' :
                  filters.sortBy === 'En Çok Cevaplanan' ? 'answers' : 'createdAt',
          sortOrder: 'desc',
          search: filters.search || undefined,
          category: filters.category || undefined,
          tags: filters.tags || undefined,
        });
        
        let data = result.data;
        // Saved only filtresi: kullanıcı bookmarklarından question-id eşleştirerek filtrele
        if (filters.savedOnly === 'true') {
          try {
            const bookmarks = await bookmarkService.getUserBookmarks();
            const savedQuestionIds = new Set(
              bookmarks.filter(b => b.target_type === 'question').map(b => b.target_id)
            );
            data = data.filter(q => savedQuestionIds.has(q.id));
          } catch {
            // sessiz geç
          }
        }

        setQuestions(data);
        setTotalQuestions(result.pagination.totalItems);
        setTotalPages(result.pagination.totalPages);
        logger.user.action('home_page_loaded');
        logger.performance.measure('home_page_load', 1500, { component: 'Home' });
      } catch (error) {
        console.error('Sorular yüklenirken hata:', error);
        // Hata durumunda boş array bırak
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [currentPage, itemsPerPage, filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = (applied: { search: string; category: string; tags: string; sortBy: string; savedOnly?: string }) => {
    const f = {
      ...filters,
      ...applied,
      savedOnly: applied.savedOnly ?? filters.savedOnly,
    };
    setFilters(f);
    const newActiveFilters: string[] = [];
    Object.entries(f).forEach(([key, value]) => {
      if (value && key !== 'sortBy' && key !== 'savedOnly') {
        newActiveFilters.push(`${key}: ${value}`);
      }
    });
    if (f.savedOnly === 'true') newActiveFilters.push(t('saved_only', currentLanguage));
    setActiveFilters(newActiveFilters);
    setCurrentPage(1); // Filtre uygulandığında ilk sayfaya dön
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      tags: '',
      sortBy: 'En Yeni',
      savedOnly: 'false',
    });
    setActiveFilters([]);
    setCurrentPage(1);
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filterToRemove));
    // Burada filtre mantığını da güncelle
  };

  const handleOpenFilterModal = () => {
    setFilterModalOpen(true);
  };

  const handleCloseFilterModal = () => {
    setFilterModalOpen(false);
  };

  const handleOpenCreateQuestionModal = () => {
    setCreateQuestionModalOpen(true);
  };

  const handleCloseCreateQuestionModal = () => {
    setCreateQuestionModalOpen(false);
    setNewQuestion({
      title: '',
      content: '',
      category: '',
      tags: '',
    });
    setValidationErrors({});
    setIsSubmitting(false);
  };

  const handleCreateQuestion = async () => {
    try {
      setIsSubmitting(true);
      setValidationErrors({});

      if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
        return;
      }

      const questionData = {
        title: newQuestion.title,
        content: newQuestion.content,
        category: newQuestion.category || 'General',
        tags: newQuestion.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      };

      await questionService.createQuestion(questionData);
      handleCloseCreateQuestionModal();
      
      // Soruları yeniden yükle
      const result = await questionService.getQuestionsPaginated({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: filters.sortBy === 'En Yeni' ? 'createdAt' : 
                filters.sortBy === 'En Popüler' ? 'likes' :
                filters.sortBy === 'En Çok Görüntülenen' ? 'views' :
                filters.sortBy === 'En Çok Cevaplanan' ? 'answers' : 'createdAt',
        sortOrder: 'desc',
        search: filters.search || undefined,
        category: filters.category || undefined,
        tags: filters.tags || undefined,
      });
      
      setQuestions(result.data);
      setTotalQuestions(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
    } catch (error: any) {
      console.error('Soru oluşturulurken hata:', error);
      
      // Backend'den gelen validasyon hatalarını işle
      if (error.response?.data?.errors) {
        const errors: any = {};
        error.response.data.errors.forEach((err: any) => {
          if (err.path && err.path[0]) {
            const field = err.path[0];
            let message = err.message;
            
            // Validasyon mesajlarını Türkçe'ye çevir
            if (message.includes('Too small')) {
              if (field === 'title') {
                message = 'Başlık en az 10 karakter olmalıdır';
              } else if (field === 'content') {
                message = 'İçerik en az 20 karakter olmalıdır';
              }
            } else if (message.includes('Required')) {
              if (field === 'title') {
                message = 'Başlık gereklidir';
              } else if (field === 'content') {
                message = 'İçerik gereklidir';
              }
            }
            
            errors[field] = message;
          }
        });
        setValidationErrors(errors);
      } else if (error.response?.data?.error) {
        // Genel hata mesajı
        setValidationErrors({ title: error.response.data.error });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeQuestion = async (questionId: string) => {
    try {
      const success = await questionService.likeQuestion(questionId);
      if (success) {
        setQuestions(prev => prev.map(q => 
          q.id === questionId ? { ...q, likes: q.likes + 1 } : q
        ));
      }
    } catch (error) {
      console.error('Soru beğenilirken hata:', error);
    }
  };

  const handleUnlikeQuestion = async (questionId: string) => {
    try {
      const success = await questionService.unlikeQuestion(questionId);
      if (success) {
        setQuestions(prev => prev.map(q => 
          q.id === questionId ? { ...q, likes: Math.max(0, q.likes - 1) } : q
        ));
      }
    } catch (error) {
      console.error('Soru beğenisi kaldırılırken hata:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const { confirmService } = await import('../services/confirmService');
    const confirmed = await confirmService.confirmDelete(undefined, currentLanguage);
    
    if (!confirmed) {
      return;
    }
    
    // Optimistic update: UI'dan hemen sil
    const previousQuestions = [...questions];
    setQuestions(prev => prev.filter(q => q.id !== questionId));
    
    try {
      await questionService.deleteQuestion(questionId);
      // Success - state already updated
    } catch (error) {
      // Rollback on error
      console.error('Soru silinirken hata:', error);
      setQuestions(previousQuestions);
      alert(t('delete_failed', currentLanguage));
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Sayfa başına öğe sayısı değiştiğinde ilk sayfaya dön
  };

  return (
    <Layout>
      {/* Filter Modal */}
      <FilterModal
        open={filterModalOpen}
        onClose={handleCloseFilterModal}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
      />

      {/* Header with Filter Button */}
      <Container maxWidth="lg" sx={{ pt: 4, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {t('questions', currentLanguage)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleOpenCreateQuestionModal}
              startIcon={<Add />}
              sx={{
                background: 'linear-gradient(135deg, #00ED64 0%, #00C853 100%)',
                borderRadius: 12,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                boxShadow: '0 4px 20px rgba(0, 237, 100, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00FF6B 0%, #00ED64 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(0, 237, 100, 0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {t('create_question', currentLanguage)}
            </Button>
            <FilterButton
              onClick={handleOpenFilterModal}
              startIcon={<FilterList />}
            >
              {t('filter', currentLanguage)}
            </FilterButton>
          </Box>
        </Box>

        {/* Aktif Filtreler */}
        {activeFilters.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 1 }}>
              Aktif Filtreler:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {activeFilters.map((filter, index) => (
                <ActiveFilterChip
                  key={index}
                  label={filter}
                  onDelete={() => handleRemoveFilter(filter)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Sayfa başına öğe sayısı seçimi */}
        <ItemsPerPageContainer>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            {t('items_per_page', currentLanguage)}:
          </Typography>
          <RadioGroup
            row
            value={itemsPerPage.toString()}
            onChange={handleItemsPerPageChange}
            sx={{
              '& .MuiFormControlLabel-root': {
                margin: 0,
                marginRight: 2,
              },
              '& .MuiRadio-root': {
                color: 'rgba(255,255,255,0.7)',
                '&.Mui-checked': {
                  color: '#FFB800',
                },
              },
              '& .MuiFormControlLabel-label': {
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.875rem',
              },
            }}
          >
            <FormControlLabel value="10" control={<Radio />} label="10" />
            <FormControlLabel value="25" control={<Radio />} label="25" />
            <FormControlLabel value="50" control={<Radio />} label="50" />
          </RadioGroup>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', ml: 'auto' }}>
            {t('total_questions', currentLanguage)}: {totalQuestions}
          </Typography>
        </ItemsPerPageContainer>
      </Container>

      {/* Timeline (Soru Kartları) */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Box>
          {loading ? (
            <HomePageSkeleton />
          ) : questions.length > 0 ? (
            <>
              {questions.map((question, index) => (
                <Fade in timeout={800 + index * 200} key={question.id}>
                  <QuestionCard>
                    {/* Tıklanabilir alan - kartın çeperlerinden 2px içeride */}
                    <Box 
                      sx={{ 
                        cursor: 'pointer',
                        padding: '2px',
                        margin: '-2px',
                        borderRadius: '14px', // 16 - 2 = 14 (kartın border radius'ından 2px az)
                        '&:hover': {
                          opacity: 0.9
                        }
                      }}
                      onClick={() => window.location.href = `/questions/${question.id}`}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Avatar 
                              src={question.userInfo?.profile_image || question.author.avatar} 
                              sx={{ 
                                width: 32, 
                                height: 32,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${question.author.id}`);
                              }}
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'rgba(255,255,255,0.8)',
                                cursor: 'pointer',
                                '&:hover': { color: 'rgba(255,184,0,0.8)' }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${question.author.id}`);
                              }}
                            >
                              {question.userInfo?.name || question.author.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              •
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              {question.timeAgo}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              •
                            </Typography>
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
                          
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 600, 
                              mb: 2,
                              color: 'white',
                            }}
                          >
                            {question.title}
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ mb: 3, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}
                          >
                            {question.content.length > 200 
                              ? `${question.content.substring(0,200)}...` 
                              : question.content
                            }
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
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
                                  '&:hover': {
                                    background: 'rgba(255, 184, 0, 0.1)',
                                  }
                                }}
                              />
                            ))}
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                  opacity: 0.8,
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                question.likes > 0 ? handleUnlikeQuestion(question.id) : handleLikeQuestion(question.id);
                              }}
                            >
                              {question.likes > 0 ? (
                                <ThumbUp sx={{ fontSize: 18, color: '#FFB800' }} />
                              ) : (
                                <ThumbUp sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                              )}
                              <span style={{ 
                                color: question.likes > 0 ? '#FFB800' : 'rgba(255,255,255,0.8)', 
                                fontSize: 14,
                                fontWeight: question.likes > 0 ? 600 : 400
                              }}>
                                {question.likes}
                              </span>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Comment sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{question.answers}</span>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Visibility sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{question.views}</span>
                            </Box>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <BookmarkButton 
                            targetType={'question'} 
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
                          {user && (
                            question.author.id === user.id || 
                            question.userInfo?._id === user.id ||
                            question.author.id === user.id?.toString()
                          ) && (
                            <IconButton 
                              size="small" 
                              sx={{ 
                                color: 'rgba(255,80,80,0.8)',
                                cursor: 'pointer',
                                '&:hover': {
                                  color: 'rgba(255,80,80,1)',
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteQuestion(question.id);
                              }}
                              title={t('delete', currentLanguage)}
                            >
                              <Delete />
                            </IconButton>
                          )}
                          <IconButton 
                            size="small" 
                            sx={{ 
                              color: 'rgba(255,255,255,0.7)',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Share />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ 
                              color: 'rgba(255,255,255,0.7)',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  </QuestionCard>
                </Fade>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <PaginationContainer>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        color: 'rgba(255,255,255,0.8)',
                        border: '1px solid rgba(255,184,0,0.3)',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,184,0,0.1)',
                          borderColor: 'rgba(255,184,0,0.5)',
                        },
                        '&.Mui-selected': {
                          backgroundColor: '#FFB800',
                          color: 'white',
                          borderColor: '#FFB800',
                          '&:hover': {
                            backgroundColor: '#FFD54F',
                          },
                        },
                      },
                      '& .MuiPaginationItem-icon': {
                        color: 'rgba(255,255,255,0.8)',
                      },
                    }}
                  />
                </PaginationContainer>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                {totalQuestions === 0 ? t('no_questions', currentLanguage) : t('no_questions_found', currentLanguage)}
              </Typography>
              {totalQuestions === 0 && (
                <Button
                  variant="contained"
                  onClick={handleOpenCreateQuestionModal}
                  startIcon={<Add />}
                  sx={{
                    background: 'linear-gradient(135deg, #00ED64 0%, #00C853 100%)',
                    borderRadius: 12,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #00FF6B 0%, #00ED64 100%)',
                    },
                  }}
                >
                  {t('be_first_to_ask', currentLanguage)}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Container>

      {/* Soru Oluşturma Modal */}
      <Dialog 
        open={createQuestionModalOpen} 
        onClose={handleCloseCreateQuestionModal}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            margin: 1,
            maxHeight: '95vh',
            minWidth: 500,
            width: '100%',
          }
        }}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(30, 58, 71, 0.95) 0%, rgba(21, 42, 53, 0.98) 100%)',
            border: '1px solid rgba(255, 184, 0, 0.15)',
            color: 'white',
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #FFB800 0%, #FF8F00 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 700,
          borderBottom: '1px solid rgba(255, 184, 0, 0.2)',
          pb: 2,
          px: 3,
        }}>
          {t('new_question', currentLanguage)}
        </DialogTitle>
        <DialogContent sx={{ overflow: 'auto', maxHeight: '70vh', px: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
              * {t('validation_title_min', currentLanguage)}, {t('validation_content_min', currentLanguage).toLowerCase()}
            </Typography>
            <TextField
              label={t('question_title', currentLanguage)}
              fullWidth
              value={newQuestion.title}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
              error={!!validationErrors.title}
              helperText={validationErrors.title}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: validationErrors.title ? '#f44336' : 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: validationErrors.title ? '#f44336' : 'rgba(255, 184, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: validationErrors.title ? '#f44336' : '#FFB800',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: validationErrors.title ? '#f44336' : 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: validationErrors.title ? '#f44336' : '#FFB800',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                },
              }}
            />
            <TextField
              label={t('question_content', currentLanguage)}
              fullWidth
              multiline
              rows={4}
              value={newQuestion.content}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, content: e.target.value }))}
              error={!!validationErrors.content}
              helperText={validationErrors.content}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: validationErrors.content ? '#f44336' : 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: validationErrors.content ? '#f44336' : 'rgba(255, 184, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: validationErrors.content ? '#f44336' : '#FFB800',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: validationErrors.content ? '#f44336' : 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: validationErrors.content ? '#f44336' : '#FFB800',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                },
              }}
            />
            <FormControl fullWidth error={!!validationErrors.category}>
              <InputLabel sx={{ color: validationErrors.category ? '#f44336' : 'rgba(255, 255, 255, 0.7)' }}>{t('category', currentLanguage)}</InputLabel>
              <Select
                value={newQuestion.category}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value }))}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: validationErrors.category ? '#f44336' : 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: validationErrors.category ? '#f44336' : 'rgba(255, 184, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: validationErrors.category ? '#f44336' : '#FFB800',
                  },
                  '& .MuiSvgIcon-root': {
                    color: validationErrors.category ? '#f44336' : 'rgba(255, 255, 255, 0.7)',
                  },
                }}
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('tags', currentLanguage)}
              fullWidth
              value={newQuestion.tags}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, tags: e.target.value }))}
              placeholder={t('tags_placeholder', currentLanguage)}
              error={!!validationErrors.tags}
              helperText={validationErrors.tags}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: validationErrors.tags ? '#f44336' : 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: validationErrors.tags ? '#f44336' : 'rgba(255, 184, 0, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: validationErrors.tags ? '#f44336' : '#FFB800',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: validationErrors.tags ? '#f44336' : 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: validationErrors.tags ? '#f44336' : '#FFB800',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 2, borderTop: '1px solid rgba(255, 184, 0, 0.2)' }}>
          <Button 
            onClick={handleCloseCreateQuestionModal}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            {t('cancel', currentLanguage)}
          </Button>
          <Button 
            onClick={handleCreateQuestion}
            variant="contained"
            disabled={!newQuestion.title.trim() || !newQuestion.content.trim() || isSubmitting}
            sx={{
              background: 'linear-gradient(135deg, #00ED64 0%, #00C853 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #00FF6B 0%, #00ED64 100%)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            {isSubmitting ? t('creating', currentLanguage) : t('create_question', currentLanguage)}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default Home;
