import { useEffect } from 'react';
import { Container, Box, Button, Pagination, Fade, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from '../components/layout/Layout';
import { HomePageSkeleton } from '../components/ui/Skeleton';
import FilterModal from '../components/ui/FilterModal';
import LikesModal from '../components/ui/LikesModal';
import { closeModal } from '../store/likes/likesSlice';
import QuestionCard from '../components/question/QuestionCard';
import HomeHeader from '../components/home/HomeHeader';
import ActiveFilters from '../components/home/ActiveFilters';
import ItemsPerPageSelector from '../components/home/ItemsPerPageSelector';
import CreateQuestionModal from '../components/question/CreateQuestionModal';
import { type Question } from '../types/question';
import { type Answer } from '../types/answer';
import { t } from '../utils/translations';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  fetchHomeQuestions,
  loadParents,
  createHomeQuestion,
} from '../store/home/homeThunks';
import {
  updateFilter,
  setActiveFilters,
  clearFilters,
  setFilterModalOpen,
  setCreateQuestionModalOpen,
  updateNewQuestionField,
  clearCreateQuestionForm,
  setCurrentPage,
  setItemsPerPage,
  updateQuestionInList,
  removeQuestionFromList,
} from '../store/home/homeSlice';
import { likeQuestion, unlikeQuestion, deleteQuestion } from '../store/questions/questionThunks';

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

const Home = () => {
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user } = useAppSelector(state => state.auth);
  const { modalOpen: likesModalOpen, users: likesModalUsers } = useAppSelector(state => state.likes);
  
  // Redux state
  const {
    loading,
    questions,
    parentQuestions,
    parentAnswers,
    parentAnswerQuestions,
    filters,
    activeFilters,
    filterModalOpen,
    createQuestionModalOpen,
    newQuestion,
    validationErrors,
    isSubmitting,
    currentPage,
    itemsPerPage,
    totalQuestions,
    totalPages,
  } = useAppSelector(state => state.home);

  // Backend'den paginated soruları çek
  useEffect(() => {
    dispatch(fetchHomeQuestions({
      page: currentPage,
      limit: itemsPerPage,
      sortBy: filters.sortBy,
      sortOrder: 'desc',
      search: filters.search || undefined,
      category: filters.category || undefined,
      tags: filters.tags || undefined,
      savedOnly: filters.savedOnly || undefined,
    }));
  }, [dispatch, currentPage, itemsPerPage, filters]);

  // Load parent questions and answers for questions that have a parent
  useEffect(() => {
    if (questions && questions.length > 0) {
      dispatch(loadParents(questions));
    }
  }, [dispatch, questions]);

  const handleFilterChange = (field: string, value: string) => {
    dispatch(updateFilter({ field, value }));
  };

  const handleApplyFilters = (applied: { search: string; category: string; tags: string; sortBy: string; savedOnly?: string }) => {
    const f = {
      ...filters,
      ...applied,
      savedOnly: applied.savedOnly ?? filters.savedOnly,
    };
    Object.entries(f).forEach(([key, value]) => {
      dispatch(updateFilter({ field: key, value: value as string }));
    });
    const newActiveFilters: string[] = [];
    Object.entries(f).forEach(([key, value]) => {
      if (value && key !== 'sortBy' && key !== 'savedOnly') {
        newActiveFilters.push(`${key}: ${value}`);
      }
    });
    if (f.savedOnly === 'true') newActiveFilters.push(t('saved_only', currentLanguage));
    dispatch(setActiveFilters(newActiveFilters));
    dispatch(setCurrentPage(1)); // Filtre uygulandığında ilk sayfaya dön
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    dispatch(setActiveFilters(activeFilters.filter(f => f !== filterToRemove)));
    // Burada filtre mantığını da güncelle
  };

  const handleOpenFilterModal = () => {
    dispatch(setFilterModalOpen(true));
  };

  const handleCloseFilterModal = () => {
    dispatch(setFilterModalOpen(false));
  };

  const handleOpenCreateQuestionModal = () => {
    dispatch(setCreateQuestionModalOpen(true));
  };

  const handleCloseCreateQuestionModal = () => {
    dispatch(setCreateQuestionModalOpen(false));
    dispatch(clearCreateQuestionForm());
  };

  const handleCreateQuestion = async () => {
    if (!newQuestion.title.trim() || !newQuestion.content.trim()) {
      return;
    }

    const questionData = {
      title: newQuestion.title,
      content: newQuestion.content,
      category: newQuestion.category || 'General',
      tags: newQuestion.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    const result = await dispatch(createHomeQuestion(questionData));
    
    if (createHomeQuestion.fulfilled.match(result)) {
      handleCloseCreateQuestionModal();
      
      // Soruları yeniden yükle
      dispatch(fetchHomeQuestions({
        page: currentPage,
        limit: itemsPerPage,
        sortBy: filters.sortBy,
        sortOrder: 'desc',
        search: filters.search || undefined,
        category: filters.category || undefined,
        tags: filters.tags || undefined,
        savedOnly: filters.savedOnly || undefined,
      }));
    }
  };

  const handleLikeQuestion = async (questionId: string) => {
    const result = await dispatch(likeQuestion(questionId));
    if (likeQuestion.fulfilled.match(result) && user) {
      dispatch(updateQuestionInList({
        questionId,
        updates: {
          likesCount: questions.find(q => q.id === questionId)!.likesCount + 1,
          likedByUsers: [...questions.find(q => q.id === questionId)!.likedByUsers, user.id],
        },
      }));
    }
  };

  const handleUnlikeQuestion = async (questionId: string) => {
    const result = await dispatch(unlikeQuestion(questionId));
    if (unlikeQuestion.fulfilled.match(result) && user) {
      dispatch(updateQuestionInList({
        questionId,
        updates: {
          likesCount: Math.max(0, questions.find(q => q.id === questionId)!.likesCount - 1),
          likedByUsers: questions.find(q => q.id === questionId)!.likedByUsers.filter(id => id !== user.id),
        },
      }));
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const { confirmService } = await import('../services/confirmService');
    const confirmed = await confirmService.confirmDelete(undefined, currentLanguage);
    
    if (!confirmed) {
      return;
    }
    
    // Optimistic update: UI'dan hemen sil
    dispatch(removeQuestionFromList(questionId));
    
    const result = await dispatch(deleteQuestion(questionId));
    if (deleteQuestion.rejected.match(result)) {
      // TODO: Add rollback logic if needed
      alert(t('delete_failed', currentLanguage));
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    dispatch(setCurrentPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value);
    dispatch(setItemsPerPage(newItemsPerPage));
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
        <HomeHeader
          onOpenCreateModal={handleOpenCreateQuestionModal}
          onOpenFilterModal={handleOpenFilterModal}
          currentLanguage={currentLanguage}
        />

        {/* Aktif Filtreler */}
        <ActiveFilters
          filters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
        />

        {/* Sayfa başına öğe sayısı seçimi */}
        <ItemsPerPageSelector
          itemsPerPage={itemsPerPage}
          totalQuestions={totalQuestions}
          onItemsPerPageChange={handleItemsPerPageChange}
          currentLanguage={currentLanguage}
        />
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
                  <QuestionCard
                    question={question}
                    onLike={handleLikeQuestion}
                    onUnlike={handleUnlikeQuestion}
                    onDelete={handleDeleteQuestion}
                    parentQuestions={parentQuestions}
                    parentAnswers={parentAnswers}
                    parentAnswerQuestions={parentAnswerQuestions}
                  />
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
      <CreateQuestionModal
        open={createQuestionModalOpen}
        onClose={handleCloseCreateQuestionModal}
        onSubmit={handleCreateQuestion}
        question={newQuestion}
        onQuestionChange={(field, value) => dispatch(updateNewQuestionField({ field, value }))}
        validationErrors={validationErrors}
        isSubmitting={isSubmitting}
        currentLanguage={currentLanguage}
      />

      {/* Likes Modal */}
      <LikesModal 
        open={likesModalOpen}
        onClose={() => dispatch(closeModal())}
        users={likesModalUsers}
      />
    </Layout>
  );
};

export default Home;
