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
import { t } from '../utils/translations';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import papyrusGenis2Dark from '../asset/textures/papyrus_genis_2_dark.png';
import papyrusGenis2Light from '../asset/textures/papyrus_genis_2.png';
import papyrusVertical1 from '../asset/textures/papyrus_vertical_1.png';
import {
  fetchHomeQuestions,
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
import { fetchUserBookmarks } from '../store/bookmarks/bookmarkThunks';

const PaginationContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPapirus',
})<{ isPapirus?: boolean }>(({ theme, isPapirus }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginTop: theme.spacing(4),
  padding: theme.spacing(2),
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
    : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
  borderRadius: 16,
  border: `1px solid ${theme.palette.primary.main}33`,
  position: 'relative',
  overflow: 'hidden',
  ...(isPapirus ? {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `url(${papyrusVertical1})`,
      backgroundSize: '115%',
      backgroundPosition: 'center 15%',
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
}));

const Home = () => {
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user, isAuthenticated } = useAppSelector(state => state.auth);
  const { modalOpen: likesModalOpen, users: likesModalUsers } = useAppSelector(state => state.likes);
  const { items: bookmarks } = useAppSelector(state => state.bookmarks);
  
  // Redux state
  const {
    loading,
    questions,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, filters.search, filters.category, filters.tags, filters.sortBy, filters.savedOnly]);

  // Fetch bookmarks once on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && bookmarks.length === 0) {
      dispatch(fetchUserBookmarks());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Only fetch once when authenticated


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

  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const papyrusTexture = papyrusGenis2Dark; // Papirüs temasında her zaman dark texture kullan

  return (
    <Layout>
      {/* Papyrus Background for Home Page */}
      {isPapirus && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${papyrusTexture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: mode === 'dark' ? 0.2 : 0.3,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

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
      <Container maxWidth="lg" sx={{ pt: 4, pb: 2, position: 'relative', zIndex: 1 }}>
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
      <Container maxWidth="lg" sx={{ pb: 8, position: 'relative', zIndex: 1 }}>
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
                    isAlternateTexture={index % 2 === 1} // Çift sıralar için alternatif texture
                  />
                </Fade>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <PaginationContainer isPapirus={isPapirus}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                    sx={(theme) => ({
                      '& .MuiPaginationItem-root': {
                        color: theme.palette.text.secondary,
                        border: `1px solid ${theme.palette.primary.main}50`,
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.05)' 
                          : 'rgba(0,0,0,0.03)',
                        '&:hover': {
                          backgroundColor: `${theme.palette.primary.main}22`,
                          borderColor: theme.palette.primary.main,
                        },
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          borderColor: theme.palette.primary.main,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                          },
                        },
                      },
                      '& .MuiPaginationItem-icon': {
                        color: theme.palette.text.secondary,
                      },
                    })}
                  />
                </PaginationContainer>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={(theme) => ({ color: theme.palette.text.secondary, mb: 2 })}>
                {totalQuestions === 0 ? t('no_questions', currentLanguage) : t('no_questions_found', currentLanguage)}
              </Typography>
              {totalQuestions === 0 && (
                <Button
                  variant="contained"
                  onClick={handleOpenCreateQuestionModal}
                  startIcon={<Add />}
                  sx={(theme) => {
                    const isMolume = themeName === 'molume';
                    const buttonColors = isMolume 
                      ? { main: '#00ED64', light: '#00FF6B', dark: '#00C853', contrastText: '#000000' }
                      : { main: theme.palette.success.main, light: theme.palette.success.light, dark: theme.palette.success.dark, contrastText: theme.palette.success.contrastText || 'white' };
                    
                    return {
                      background: `linear-gradient(135deg, ${buttonColors.main} 0%, ${buttonColors.dark} 100%)`,
                      color: buttonColors.contrastText,
                    borderRadius: 12,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': {
                        background: `linear-gradient(135deg, ${buttonColors.light} 0%, ${buttonColors.main} 100%)`,
                    },
                    };
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
