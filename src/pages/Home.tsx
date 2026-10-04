import { useCallback, useEffect } from 'react';
import { Box, Button, Pagination, Fade, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from '../components/layout/Layout';
import { HomePageSkeleton } from '../components/ui/skeleton';
import LikesModal from '../components/ui/LikesModal';
import { closeModal } from '../store/likes/likesSlice';
import QuestionCard from '../components/question/QuestionCard';
import HomeHeader from '../components/home/HomeHeader';
import ItemsPerPageSelector from '../components/home/ItemsPerPageSelector';
import CreateQuestionFlow from '../components/question/CreateQuestionFlow';
import BookmarkSidebar from '../components/bookmark/BookmarkSidebar';
import {
  QUESTION_SUMMARY_MIN_LENGTH,
  QUESTION_SUMMARY_MAX_LENGTH,
  QUESTION_DETAIL_MIN_LENGTH,
  QUESTION_DETAIL_MAX_LENGTH,
  TAG_MAX_LENGTH,
  TAG_MAX_COUNT,
} from '../constants/questionValidation';
import { t } from '../utils/translations';
import { referenceNeedsDescription } from '../utils/filledEntries';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import papyrusGenis2Dark from '../asset/textures/papyrus_genis_2_dark.png';
import papyrusVertical1 from '../asset/textures/papyrus_vertical_1.png';
import {
  fetchHomeQuestions,
  createHomeQuestion,
} from '../store/home/homeThunks';
import {
  setCreateQuestionModalOpen,
  updateNewQuestionField,
  clearCreateQuestionForm,
  setCurrentPage,
  setItemsPerPage,
  setDateSort,
  updateQuestionInList,
  removeQuestionFromList,
  setValidationErrors,
} from '../store/home/homeSlice';
import { likeQuestion, unlikeQuestion, deleteQuestion } from '../store/questions/questionThunks';
import { fetchUserBookmarks } from '../store/bookmarks/bookmarkThunks';
import { contentAssetService, uploadFileToPresignedUrl } from '../services/contentAssetService';
import { showErrorToast, showSuccessToast } from '../utils/notificationUtils';
import type { CreateQuestionData, QuestionReference } from '../types/question';
import type { CreateQuestionLeftState } from '../components/question/CreateQuestionLeftModal';
import { questionFeatureTemplateService } from '../services/questionFeatureTemplateService';
import { parseFeatureFieldDefs, valuesFormToApi } from '../utils/featureTemplateUtils';

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
    createQuestionModalOpen,
    newQuestion,
    validationErrors,
    isSubmitting,
    currentPage,
    itemsPerPage,
    dateSort,
    totalQuestions,
    totalPages,
  } = useAppSelector(state => state.home);

  // Backend'den paginated soruları çek (filtreler arama sayfasında)
  useEffect(() => {
    dispatch(fetchHomeQuestions({
      page: currentPage,
      limit: itemsPerPage,
      sortBy: 'En Yeni',
      sortOrder: dateSort === 'oldest' ? 'asc' : 'desc',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, dateSort]);

  // Fetch bookmarks once on mount if authenticated
  useEffect(() => {
    if (isAuthenticated && bookmarks.length === 0) {
      dispatch(fetchUserBookmarks());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Only fetch once when authenticated


  const handleOpenCreateQuestionModal = () => {
    dispatch(setCreateQuestionModalOpen(true));
  };

  const handleCloseCreateQuestionModal = () => {
    dispatch(setCreateQuestionModalOpen(false));
    dispatch(clearCreateQuestionForm());
  };

  const handleQuestionFieldChange = useCallback((field: string, value: string) => {
    let v = value || '';
    if (field === 'summary') v = v.slice(0, QUESTION_SUMMARY_MAX_LENGTH);
    else if (field === 'detail') v = v.slice(0, QUESTION_DETAIL_MAX_LENGTH);
    else if (field === 'tags') {
      const tags = v.split(',').map((t) => t.trim().slice(0, TAG_MAX_LENGTH)).filter(Boolean).slice(0, TAG_MAX_COUNT);
      v = tags.join(', ');
      if (validationErrors.tags) {
        const { tags: _t, ...rest } = validationErrors;
        dispatch(setValidationErrors(rest));
      }
    }
    dispatch(updateNewQuestionField({ field, value: v }));
  }, [dispatch, validationErrors]);

  const handleCreateQuestion = async ({
    thumbnailFile,
    leftState,
    rightState,
    attachedFiles,
  }: {
    thumbnailFile?: File | null;
    removeThumbnail?: boolean;
    leftState?: CreateQuestionLeftState;
    rightState?: { references: { type: string; content: string; description: string }[]; metadata: { key: string; value: string }[] };
    attachedFiles?: { id: string; file: File; description: string }[];
  }) => {
    if (!newQuestion.summary.trim() || !newQuestion.detail.trim()) {
      return;
    }
    if (newQuestion.summary.length < QUESTION_SUMMARY_MIN_LENGTH || newQuestion.summary.length > QUESTION_SUMMARY_MAX_LENGTH) {
      dispatch(setValidationErrors({
        summary: newQuestion.summary.length < QUESTION_SUMMARY_MIN_LENGTH ? t('validation_summary_min', currentLanguage) : t('validation_summary_max', currentLanguage),
      }));
      return;
    }
    if (newQuestion.detail.length < QUESTION_DETAIL_MIN_LENGTH || newQuestion.detail.length > QUESTION_DETAIL_MAX_LENGTH) {
      dispatch(setValidationErrors({
        detail: newQuestion.detail.length < QUESTION_DETAIL_MIN_LENGTH ? t('validation_detail_min', currentLanguage) : t('validation_detail_max', currentLanguage),
      }));
      return;
    }

    const tagsArray = newQuestion.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagsArray.length > TAG_MAX_COUNT) {
      dispatch(setValidationErrors({ tags: t('validation_tag_max_count', currentLanguage) }));
      return;
    }
    const invalidTag = tagsArray.find((t) => t.length > TAG_MAX_LENGTH);
    if (invalidTag) {
      dispatch(setValidationErrors({ tags: t('validation_tag_max_chars', currentLanguage) }));
      return;
    }

    const soruCevapRefWithoutDesc = rightState?.references?.find(
      (r) => referenceNeedsDescription(r.type) && r.content?.trim() && !r.description?.trim()
    );
    if (soruCevapRefWithoutDesc) {
      showErrorToast(t('reference_description_required', currentLanguage));
      return;
    }

    try {
      let thumbnailKey: string | undefined;

      if (thumbnailFile) {
        if (!user) {
          showErrorToast(t('login_required', currentLanguage));
          return;
        }

        const presigned = await contentAssetService.createPresignedUpload({
          type: 'question-thumbnail',
          filename: thumbnailFile.name,
          mimeType: thumbnailFile.type,
          contentLength: thumbnailFile.size,
          ownerId: user.id,
          visibility: 'public',
        });

        await uploadFileToPresignedUrl(presigned, thumbnailFile);
        thumbnailKey = presigned.key;
      }

      let attachmentKeys: { key: string; description?: string; size?: number }[] | undefined;
      if (attachedFiles?.length) {
        if (!user) {
          showErrorToast(t('login_required', currentLanguage));
          return;
        }
        attachmentKeys = [];
        for (const af of attachedFiles) {
          const presigned = await contentAssetService.createPresignedUpload({
            type: 'question-attachment',
            filename: af.file.name,
            mimeType: af.file.type,
            contentLength: af.file.size,
            ownerId: user.id,
            visibility: 'public',
          });
          await uploadFileToPresignedUrl(presigned, af.file);
          attachmentKeys.push({ key: presigned.key, description: af.description || undefined, size: af.file.size });
        }
      }

      const mappedReferences = rightState?.references?.length
        ? rightState.references.map((ref) => {
            if (ref.type === 'dosya' && ref.content && attachedFiles?.length && attachmentKeys?.length) {
              const idx = attachedFiles.findIndex((af) => af.id === ref.content);
              if (idx >= 0 && attachmentKeys[idx]) {
                return { ...ref, content: attachmentKeys[idx].key };
              }
            }
            return ref;
          }) as QuestionReference[]
        : undefined;

      let featureTemplateId: string | undefined;
      let featureFieldValues: CreateQuestionData['featureFieldValues'];
      if (leftState?.featureTemplateId) {
        const tpl = await questionFeatureTemplateService.getById(leftState.featureTemplateId);
        const defs = tpl?.currentVersion?.fields
          ? parseFeatureFieldDefs(tpl.currentVersion.fields)
          : [];
        const vals = valuesFormToApi(leftState.featureFieldValues, defs);
        featureTemplateId = leftState.featureTemplateId;
        featureFieldValues = vals;
      }

      const questionData: CreateQuestionData = {
        summary: newQuestion.summary,
        detail: newQuestion.detail.slice(0, QUESTION_DETAIL_MAX_LENGTH),
        category: newQuestion.category?.trim() || undefined,
        tags: newQuestion.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        thumbnailKey,
        visibility: leftState?.visibility ?? true,
        format: leftState?.format || undefined,
        interest: leftState?.interest || undefined,
        focus: leftState?.focus ? parseInt(leftState.focus, 10) : undefined,
        references: mappedReferences,
        metadata: rightState?.metadata?.length ? rightState.metadata : undefined,
        attachments: attachmentKeys,
        ...(featureTemplateId
          ? { featureTemplateId, featureFieldValues }
          : {}),
      };

      const result = await dispatch(createHomeQuestion(questionData));

      if (createHomeQuestion.fulfilled.match(result)) {
        showSuccessToast(t('question_created', currentLanguage));
        handleCloseCreateQuestionModal();

        dispatch(
          fetchHomeQuestions({
            page: currentPage,
            limit: itemsPerPage,
            sortBy: 'En Yeni',
            sortOrder: dateSort === 'oldest' ? 'asc' : 'desc',
          })
        );
      }
    } catch (error) {
      console.error('Soru oluşturulurken hata:', error);
      showErrorToast(t('error', currentLanguage));
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
      showErrorToast(t('delete_failed', currentLanguage));
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

  const handleDateSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setDateSort(event.target.value as 'newest' | 'oldest'));
  };

  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const papyrusTexture = papyrusGenis2Dark; // Papirüs temasında her zaman dark texture kullan

  return (
    <Layout>
      <BookmarkSidebar currentLanguage={currentLanguage} />
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

      {/* Header — Layout zaten maxWidth="lg" Container kullanıyor */}
      <Box sx={{ pt: 1, pb: 2, position: 'relative', zIndex: 1 }}>
        <HomeHeader
          onOpenCreateModal={handleOpenCreateQuestionModal}
          currentLanguage={currentLanguage}
        />

        {/* Sayfa başına öğe sayısı seçimi */}
        <ItemsPerPageSelector
          itemsPerPage={itemsPerPage}
          totalQuestions={totalQuestions}
          onItemsPerPageChange={handleItemsPerPageChange}
          currentLanguage={currentLanguage}
          dateSort={dateSort}
          onDateSortChange={handleDateSortChange}
        />
      </Box>

      {/* Timeline (Soru Kartları) */}
      <Box sx={{ pb: 5, position: 'relative', zIndex: 1 }}>
        <Box>
          {loading ? (
            <HomePageSkeleton />
          ) : questions.length > 0 ? (
            <>
              {questions.map((question, index) => (
                <Fade in timeout={800 + index * 200} key={question.id}>
                  <QuestionCard
                    question={question}
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
      </Box>

      {/* Soru Oluşturma - 3 Modal (Sol, Orta, Sağ) */}
      <CreateQuestionFlow
        open={createQuestionModalOpen}
        onClose={handleCloseCreateQuestionModal}
        onSubmit={handleCreateQuestion}
        question={newQuestion}
        onQuestionChange={handleQuestionFieldChange}
        validationErrors={validationErrors}
        isSubmitting={isSubmitting}
        currentLanguage={currentLanguage}
        mode="create"
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
