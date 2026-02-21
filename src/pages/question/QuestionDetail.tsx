import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Chip,
  IconButton,
  Card,
  CardContent,
  Alert,
  useTheme,
  Dialog,
  Pagination,
} from '@mui/material';
import papyrusGenis2Dark from '../../asset/textures/papyrus_genis_2_dark.png';
import papyrusHorizontal1 from '../../asset/textures/papyrus_horizontal_1.png';
import papyrusVertical2 from '../../asset/textures/papyrus_vertical_2.png';
import papyrusWhole from '../../asset/textures/papyrus_whole.png';
import papyrusWholeDark from '../../asset/textures/papyrus_whole_dark.png';
import {
  ThumbUp,
  ThumbDown,
  Comment,
  ArrowBack,
  Send,
  AccountTree,
  Quiz,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from '../../components/layout/Layout';
import { Question, UpdateQuestionData } from '../../types/question';
import { Answer } from '../../types/answer';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import logger from '../../utils/logger';
import { t } from '../../utils/translations';
import ActionButtons from '../../components/ui/ActionButtons';
import LikesModal from '../../components/ui/LikesModal';
import ParentInfoChip from '../../components/ui/ParentInfoChip';
import { QuestionDetailSkeleton } from '../../components/ui/skeleton';
import AskQuestionModal from '../../components/question/AskQuestionModal';
import RelatedQuestionsPopover from '../../components/question/RelatedQuestionsPopover';
import RichTextEditor, { CONTENT_MAX_LENGTH } from '../../components/ui/RichTextEditor';
import ExpandableMarkdown from '../../components/ui/ExpandableMarkdown';
import AncestorsDrawer from '../../components/question/AncestorsDrawer';
import AnswerCard from '../../components/answer/AnswerCard';
import { openModal, closeModal, openDislikesModal, closeDislikesModal } from '../../store/likes/likesSlice';
import { fetchLikedUsers, fetchDislikedUsers } from '../../store/likes/likesThunks';
import { getAnswersByQuestion, createAnswer, likeAnswer, unlikeAnswer, deleteAnswer } from '../../store/answers/answerThunks';
import { updateAnswerInList, removeAnswerFromList } from '../../store/answers/answerSlice';
import CreateQuestionModal from '../../components/question/CreateQuestionModal';
import { contentAssetService, uploadFileToPresignedUrl } from '../../services/contentAssetService';
import { updateQuestion as updateQuestionThunk } from '../../store/questions/questionThunks';
import { updateQuestionInList } from '../../store/home/homeSlice';
import { showSuccessToast, showErrorToast } from '../../utils/notificationUtils';
import { fetchUserBookmarks } from '../../store/bookmarks/bookmarkThunks';

const QuestionCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isPapirus' && prop !== 'isAnswerWriting' && prop !== 'isMagnefite',
})<{ isPapirus?: boolean; isAnswerWriting?: boolean; isMagnefite?: boolean }>(({ theme, isPapirus, isAnswerWriting, isMagnefite }) => {
  // Magnefite light modunda daha koyu background
  const getBackground = () => {
    if (isMagnefite && theme.palette.mode === 'light') {
      return 'linear-gradient(135deg, #B5BAC0 0%, #A8AEB6 100%)';
    }
    return theme.palette.mode === 'dark'
      ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
      : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`;
  };

  return {
    position: 'relative',
    background: getBackground(),
    border: `1px solid ${theme.palette.primary.main}33`,
    borderRadius: 16,
    padding: theme.spacing(4),
    marginBottom: theme.spacing(3),
    color: theme.palette.text.primary,
    backdropFilter: 'blur(10px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    ...(isPapirus ? {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: isAnswerWriting
          ? (theme.palette.mode === 'dark' ? `url(${papyrusWholeDark})` : `url(${papyrusWhole})`)
          : `url(${papyrusHorizontal1})`,
        backgroundSize: isAnswerWriting ? '105%' : 'cover',
        backgroundPosition: isAnswerWriting ? 'center 15%' : 'center',
        backgroundRepeat: 'no-repeat',
        opacity: theme.palette.mode === 'dark' ? 0.12 : 0.15,
        pointerEvents: 'none',
        zIndex: 0,
      },
      '& > *:not(.action-buttons-container)': {
        position: 'relative',
        zIndex: 1,
      },
      '& > .action-buttons-container': {
        position: 'absolute',
        zIndex: 100,
      },
    } : {}),
  }
});




const ActionButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isMagnefite',
})<{ isMagnefite?: boolean }>(({ theme, isMagnefite }) => {
  // Magnefite'da primary color gri
  const primaryColor = isMagnefite
    ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray
    : theme.palette.primary.main;
  const primaryDark = isMagnefite
    ? (theme.palette.mode === 'dark' ? '#6B7280' : '#4B5563') // Darker gray
    : theme.palette.primary.dark;
  const primaryLight = isMagnefite
    ? (theme.palette.mode === 'dark' ? '#D1D5DB' : '#9CA3AF') // Lighter gray
    : theme.palette.primary.light;

  return {
    background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
    color: 'white', // Always white text
    borderRadius: 8,
    textTransform: 'none',
    fontWeight: 600,
    '&:hover': {
      background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryLight} 100%)`,
    },
    '&:disabled': {
      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
    },
  };
});

const ActionButtonsContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(4),
  right: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(0.5),
  alignItems: 'center',
  zIndex: 100,
  '&.action-buttons-container': {
    position: 'absolute',
  },
}));

const QuestionDetail: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { items: bookmarks } = useAppSelector(state => state.bookmarks);
  const { currentLanguage } = useAppSelector(state => state.language);
  const {
    modalOpen: likesModalOpen,
    users: likesModalUsers,
    dislikesModalOpen,
    dislikedUsers,
    dislikesLoading,
  } = useAppSelector(state => state.likes);
  const { answers, totalAnswers, currentPage, answersPerPage } = useAppSelector(state => state.answers);
  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';
  const isMagnefite = themeName === 'magnefite';

  const [question, setQuestion] = useState<Question | null>(null);
  const [questionThumbnailUrl, setQuestionThumbnailUrl] = useState<string | null>(null);
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
  // Related questions count for the main question
  const [questionRelatedQuestionsCount, setQuestionRelatedQuestionsCount] = useState<number>(0);

  // Ancestors drawer state
  const [ancestorsDrawerOpen, setAncestorsDrawerOpen] = useState(false);

  // Edit question modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editQuestionForm, setEditQuestionForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
  });
  const [editValidationErrors, setEditValidationErrors] = useState<{
    title?: string;
    content?: string;
    category?: string;
    tags?: string;
  }>({});
  const [updatingQuestion, setUpdatingQuestion] = useState(false);
  const [questionThumbnailPreviewOpen, setQuestionThumbnailPreviewOpen] = useState(false);
  const [answersPage, setAnswersPage] = useState(1);
  const answersLimit = 5;
  const [questionProfileImageUrl, setQuestionProfileImageUrl] = useState<string | null>(null);

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
          dispatch(getAnswersByQuestion({ questionId: id, page: answersPage, limit: answersLimit }))
        ]);

        if (questionData) {
          setQuestion(questionData);

          // Thumbnail URL'ini oluştur
          if (questionData.thumbnail?.url) {
            // URL zaten varsa direkt kullan
            setQuestionThumbnailUrl(questionData.thumbnail.url);
          } else if (questionData.thumbnail?.key) {
            // URL yoksa, key'den URL oluştur
            try {
              const thumbnailUrl = await contentAssetService.resolveAssetUrl({
                key: questionData.thumbnail.key,
                type: 'question-thumbnail',
                entityId: questionData.id,
                visibility: 'public',
                presignedUrl: false, // Use public URL if available, fallback to presigned if not
              });
              setQuestionThumbnailUrl(thumbnailUrl);
            } catch (error) {
              logger.error('Thumbnail URL oluşturulamadı:', error);
              setQuestionThumbnailUrl(null);
            }
          } else {
            setQuestionThumbnailUrl(null);
          }

          // Profile image URL'ini oluştur
          const profileImage = questionData.userInfo?.profile_image || questionData.author.avatar;
          if (profileImage && profileImage !== 'default.jpg' && !profileImage.startsWith('http')) {
            // Key ise URL resolve et - daha geniş pattern kontrolü
            try {
              const profileImageUrl = await contentAssetService.resolveAssetUrl({
                key: profileImage,
                type: 'user-profile-avatar',
                ownerId: questionData.userInfo?._id || questionData.author.id,
                visibility: 'public',
                presignedUrl: false, // Use public URL if available, fallback to presigned if not
              });
              setQuestionProfileImageUrl(profileImageUrl);
            } catch (error) {
              logger.error('Profile image URL oluşturulamadı:', error);
              setQuestionProfileImageUrl(null);
            }
          } else if (profileImage && profileImage.startsWith('http')) {
            setQuestionProfileImageUrl(profileImage);
          } else {
            setQuestionProfileImageUrl(null);
          }

          setLoadingQuestion(false); // Ana soru yüklendi, loading'i kapat

          // Parent question/answer yükle (background'da, blocking yapmadan)
          const parentId = questionData.parentQuestionId || questionData.parentAnswerId;
          if (parentId) {
            // Parent yükleme işlemini async olarak yap, blocking yapmasın
            Promise.resolve().then(async () => {
              try {
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
              } catch (err) {
                console.error('Parent content yüklenirken hata:', err);
                // Parent yüklenemezse hata verme, sadece log
              }
            });
          }
        } else {
          setError('Soru bulunamadı');
          setLoadingQuestion(false);
        }

        // Load related questions count for the main question immediately
        if (questionData) {
          try {
            const related = await questionService.getQuestionsByParent(questionData.id);
            setQuestionRelatedQuestionsCount(related.length);
          } catch (err) {
            console.error('Question related questions count hatası:', err);
            setQuestionRelatedQuestionsCount(0);
          }
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
  }, [id, dispatch, answersPage]);

  // Fetch bookmarks once on mount if authenticated (so QuestionDetail can show bookmark state)
  useEffect(() => {
    if (user && bookmarks.length === 0) {
      dispatch(fetchUserBookmarks());
    }
  }, [user, bookmarks.length, dispatch]);

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
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#answer-')) {
        const answerId = hash.substring('#answer-'.length);

        if (!id) return;

        // Cevabın hangi sayfada olduğunu bul
        const pageNumber = await answerService.getAnswerPageNumber(id, answerId, answersLimit);

        if (pageNumber) {
          // Eğer cevap mevcut sayfada değilse, o sayfaya git
          if (pageNumber !== answersPage) {
            setAnswersPage(pageNumber);
            // Sayfa değiştiğinde cevaplar yüklenecek, sonra highlight edeceğiz
            // Bu yüzden highlight'ı biraz geciktiriyoruz
            return; // Sayfa değişti, cevaplar yüklendikten sonra tekrar kontrol edilecek
          } else {
            // Cevap mevcut sayfada, direkt highlight et
            setHighlightedAnswerId(answerId);
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
        } else {
          // Cevap bulunamadı
          setHighlightedAnswerId(null);
        }
      } else {
        setHighlightedAnswerId(null);
      }
    };

    // Check hash on mount and when hash changes
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [id, answersLimit]);

  // Sayfa değiştiğinde veya cevaplar yüklendiğinde hash'i kontrol et
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#answer-')) {
      const answerId = hash.substring('#answer-'.length);

      // Cevap mevcut sayfada mı kontrol et
      const answerExists = answers.some(a => a.id === answerId);

      if (answerExists) {
        // Cevap mevcut sayfada, highlight et
        setHighlightedAnswerId(answerId);
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
    }
  }, [answers, answersPage]);

  // Cevap gönder
  const handleSubmitAnswer = async () => {
    if (!id || !newAnswer.trim() || !user) return;
    if (newAnswer.length > CONTENT_MAX_LENGTH) {
      setAnswerValidationError(t('validation_answer_max', currentLanguage));
      return;
    }

    try {
      setSubmittingAnswer(true);
      setAnswerValidationError('');

      await dispatch(createAnswer({ questionId: id, answerData: { content: newAnswer.slice(0, CONTENT_MAX_LENGTH) } }));

      setNewAnswer('');
      setAnswerValidationError('');
      // Yeni cevap eklendiğinde ilk sayfaya dön ve cevapları yeniden yükle
      setAnswersPage(1);
      if (id) {
        dispatch(getAnswersByQuestion({ questionId: id, page: 1, limit: answersLimit }));
      }
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
      showErrorToast(t('delete_failed', currentLanguage));
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
      if (id) {
        dispatch(getAnswersByQuestion({ questionId: id, page: answersPage, limit: answersLimit }));
      }
      showErrorToast(t('delete_failed', currentLanguage));
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
      parent: {
        id: askQuestionMode === 'question' ? targetQuestionId! : targetAnswerId!,
        type: askQuestionMode,
      },
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

  // Show liked users for question
  const handleShowLikedUsersForQuestion = async () => {
    if (!question || question.likedByUsers.length === 0) return;
    dispatch(openModal());
    dispatch(fetchLikedUsers(question.likedByUsers));
  };

  // Show disliked users for question
  const handleShowDislikedUsersForQuestion = async () => {
    if (!question || question.dislikedByUsers.length === 0) return;
    dispatch(openDislikesModal());
    dispatch(fetchDislikedUsers(question.dislikedByUsers));
  };

  // Show liked users for answer
  const handleShowLikedUsersForAnswer = async (answerId: string) => {
    const answer = answers.find(a => a.id === answerId);
    if (!answer || answer.likedByUsers.length === 0) return;
    dispatch(openModal());
    dispatch(fetchLikedUsers(answer.likedByUsers));
  };

  // Show disliked users for answer
  const handleShowDislikedUsersForAnswer = async (answerId: string) => {
    const answer = answers.find(a => a.id === answerId);
    if (!answer || answer.dislikedByUsers.length === 0) return;
    dispatch(openDislikesModal());
    dispatch(fetchDislikedUsers(answer.dislikedByUsers));
  };

  const handleOpenEditQuestionModal = () => {
    if (!question) return;
    setEditQuestionForm({
      title: question.title,
      content: question.content,
      category: question.category ?? '',
      tags: question.tags.join(', '),
    });
    setEditValidationErrors({});
    setEditModalOpen(true);
  };

  const handleCloseEditQuestionModal = () => {
    if (updatingQuestion) return;
    setEditModalOpen(false);
    setEditValidationErrors({});
  };

  const handleEditQuestionChange = (field: string, value: string) => {
    setEditQuestionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateEditForm = (): boolean => {
    const errors: typeof editValidationErrors = {};

    if (editQuestionForm.title.trim().length < 10) {
      errors.title = t('validation_title_min', currentLanguage);
    }

    if (editQuestionForm.content.trim().length < 20) {
      errors.content = t('validation_content_min', currentLanguage);
    } else if (editQuestionForm.content.length > CONTENT_MAX_LENGTH) {
      errors.content = t('validation_content_max', currentLanguage);
    }

    setEditValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateQuestion = async ({
    thumbnailFile,
    removeThumbnail,
  }: {
    thumbnailFile?: File | null;
    removeThumbnail?: boolean;
  }) => {
    if (!question) return;
    if (!validateEditForm()) {
      return;
    }

    try {
      setUpdatingQuestion(true);

      let newThumbnailKey: string | undefined;

      if (thumbnailFile) {
        if (!user) {
          showErrorToast(t('login_required', currentLanguage));
          setUpdatingQuestion(false);
          return;
        }

        const presigned = await contentAssetService.createPresignedUpload({
          type: 'question-thumbnail',
          filename: thumbnailFile.name,
          mimeType: thumbnailFile.type,
          contentLength: thumbnailFile.size,
          ownerId: user.id,
          entityId: question.id,
          visibility: 'public',
        });

        await uploadFileToPresignedUrl(presigned, thumbnailFile);
        newThumbnailKey = presigned.key;
      }

      const tagsArray = editQuestionForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const updatePayload: UpdateQuestionData = {
        title: editQuestionForm.title,
        content: editQuestionForm.content.slice(0, CONTENT_MAX_LENGTH),
        category: editQuestionForm.category || undefined,
        tags: tagsArray,
      };

      if (newThumbnailKey) {
        updatePayload.thumbnailKey = newThumbnailKey;
      }

      if (removeThumbnail && !thumbnailFile) {
        updatePayload.removeThumbnail = true;
      }

      const result = await dispatch(
        updateQuestionThunk({ id: question.id, questionData: updatePayload }),
      );

      if (updateQuestionThunk.fulfilled.match(result)) {
        const updatedQuestion = result.payload;
        setQuestion(updatedQuestion);

        // Thumbnail state'ini güncelle
        if (removeThumbnail && !thumbnailFile) {
          // Thumbnail kaldırıldıysa
          setQuestionThumbnailUrl(null);
        } else if (newThumbnailKey) {
          // Yeni thumbnail yüklendiyse, URL'ini oluştur
          try {
            const thumbnailUrl = await contentAssetService.resolveAssetUrl({
              key: newThumbnailKey,
              type: 'question-thumbnail',
              entityId: question.id,
            });
            setQuestionThumbnailUrl(thumbnailUrl);
          } catch (error) {
            logger.error('Yeni thumbnail URL oluşturulamadı:', error);
            setQuestionThumbnailUrl(null);
          }
        } else if (updatedQuestion.thumbnail?.url) {
          // Backend'den gelen URL'i kullan
          setQuestionThumbnailUrl(updatedQuestion.thumbnail.url);
        } else if (updatedQuestion.thumbnail?.key) {
          // Key varsa ama URL yoksa, URL oluştur
          try {
            const thumbnailUrl = await contentAssetService.resolveAssetUrl({
              key: updatedQuestion.thumbnail.key,
              type: 'question-thumbnail',
              entityId: question.id,
            });
            setQuestionThumbnailUrl(thumbnailUrl);
          } catch (error) {
            logger.error('Thumbnail URL oluşturulamadı:', error);
            setQuestionThumbnailUrl(null);
          }
        } else {
          setQuestionThumbnailUrl(null);
        }

        setEditModalOpen(false);
        setEditValidationErrors({});
        setQuestionThumbnailPreviewOpen(false);
        showSuccessToast(t('question_updated', currentLanguage));
        dispatch(updateQuestionInList({ questionId: updatedQuestion.id, updates: updatedQuestion }));
      } else {
        const message =
          (result.payload as { message?: string } | undefined)?.message ||
          t('question_update_failed', currentLanguage);
        showErrorToast(message);
      }
    } catch (err) {
      console.error('Soru güncellenirken hata:', err);
      showErrorToast(t('question_update_failed', currentLanguage));
    } finally {
      setUpdatingQuestion(false);
    }
  };

  if (loadingQuestion) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ pt: 4, pb: 8, position: 'relative', zIndex: 1 }}>
          <QuestionDetailSkeleton />
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
            sx={{
              color: theme.palette.text.primary,
              borderColor: theme.palette.divider,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                background: `${theme.palette.primary.main}11`,
              }
            }}
          >
            {t('back', currentLanguage)}
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Papyrus Background for Question Detail Page */}
      {isPapirus && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${papyrusGenis2Dark})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: mode === 'dark' ? 0.2 : 0.3,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <Container maxWidth="lg" sx={{ pt: 4, pb: 8, position: 'relative', zIndex: 1 }}>
        {/* Geri Dön Butonu */}
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => {
            const from = (location.state as any)?.from;
            if (from) {
              navigate(from);
            } else {
              navigate(-1);
            }
          }}
          sx={{
            mb: 3,
            color: theme.palette.text.primary,
            borderColor: theme.palette.divider,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              background: `${theme.palette.primary.main}11`,
            }
          }}
        >
          {t('back', currentLanguage)}
        </Button>

        {/* Soru Detayı */}
        <Box sx={{ position: 'relative' }}>
          <QuestionCard isPapirus={isPapirus} isMagnefite={isMagnefite}>
            {/* Action Buttons - Sağ Üst Köşe - Doğrudan QuestionCard içinde */}
            <ActionButtonsContainer className="action-buttons-container">
              <ActionButtons
                targetType="question"
                targetId={question.id}
                targetData={{
                  title: question.title,
                  content: question.content,
                  author: question.author?.name,
                  authorId: question.author?.id,
                  created_at: question.createdAt,
                  url: window.location.origin + '/questions/' + question.id,
                }}
                position="relative"
                showBookmark={true}
                showLike={true}
                showDislike={true}
                showDelete={!!(user && (question.author.id === user.id || question.userInfo?._id === user.id || question.author.id === user.id?.toString()))}
                showHelp={true}
                showEdit={!!(user && (question.author.id === user.id || question.userInfo?._id === user.id || question.author.id === user.id?.toString()))}
                isLiked={question.likedByUsers.includes(user?.id || '')}
                isDisliked={question.dislikedByUsers.includes(user?.id || '')}
                canDelete={!!(user && (question.author.id === user.id || question.userInfo?._id === user.id || question.author.id === user.id?.toString()))}
                isBookmarked={!!bookmarks.find(b => b.target_type === 'question' && b.target_id === question.id)}
                bookmarkId={bookmarks.find(b => b.target_type === 'question' && b.target_id === question.id)?._id || null}
                onLike={handleLikeQuestion}
                onUnlike={handleUnlikeQuestion}
                onDislike={handleDislikeQuestion}
                onUndislike={handleUndoDislikeQuestion}
                onDelete={(e) => {
                  e.stopPropagation();
                  handleDeleteQuestion();
                }}
                onHelp={(e) => {
                  e.stopPropagation();
                  handleAskQuestionAboutQuestion();
                }}
                onEdit={(e) => {
                  e.stopPropagation();
                  handleOpenEditQuestionModal();
                }}
              />
            </ActionButtonsContainer>

            {/* Parent Question/Answer Info with Ancestors Button */}
            {(question.parentQuestionId || question.parentAnswerId) && (() => {
              const parentId = question.parentQuestionId || question.parentAnswerId;

              return (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2, maxWidth: 'calc(100% - 200px)', pr: 20 }}>
                  {question.ancestors && question.ancestors.length > 1 && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAncestorsDrawerOpen(true);
                      }}
                      sx={{
                        color: themeName === 'molume'
                          ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') // Brighter purple in dark mode
                          : themeName === 'magnefite'
                            ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                            : `${theme.palette.primary.main}CC`,
                        '&:hover': {
                          color: themeName === 'molume'
                            ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') // Brighter purple in dark mode
                            : themeName === 'magnefite'
                              ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                              : theme.palette.primary.main,
                          bgcolor: themeName === 'molume'
                            ? (theme.palette.mode === 'dark' ? '#7A4A75' : '#5E315A') + '22' // Brighter purple in dark mode
                            : themeName === 'magnefite'
                              ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') + '22' // Gray for Magnefite
                              : `${theme.palette.primary.main}22`,
                        }
                      }}
                      title={t('show_all_ancestors', currentLanguage)}
                    >
                      <AccountTree />
                    </IconButton>
                  )}
                  <ParentInfoChip
                    parentQuestion={parentQuestion}
                    parentAnswer={parentAnswer}
                    parentId={parentId!}
                    parentAnswerQuestion={parentAnswerQuestion}
                  />
                </Box>
              );
            })()}

            <Box sx={{ mb: 3 }}>
              <Box sx={{ flex: 1, width: '100%' }}>

                {/* Yazar Bilgisi */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'relative' }}>
                  <Avatar
                    src={questionProfileImageUrl || question.userInfo?.profile_image || question.author.avatar}
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
                        color: isMagnefite
                          ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                          : theme.palette.text.primary,
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': {
                          color: isMagnefite
                            ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                            : theme.palette.primary.main
                        }
                      }}
                      onClick={() => navigate(`/profile/${question.author.id}`)}
                    >
                      {question.userInfo?.name || question.author.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {question.timeAgo}
                    </Typography>
                  </Box>
                </Box>

                {/* Kategori */}
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={question.category}
                    size="small"
                    sx={(theme) => {
                      const chipColor = isMagnefite
                        ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                        : theme.palette.primary.main;
                      return {
                        bgcolor: `${chipColor}33`,
                        color: chipColor,
                        fontSize: '0.75rem',
                      };
                    }}
                  />
                </Box>

                {/* Soru Başlığı, İçeriği ve Thumbnail */}
                <Box sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-start',
                  mb: 4,
                  width: '100%',
                }}>
                  {/* Başlık ve İçerik Container */}
                  <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: 3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                        pr: 10, // ActionButtons için sağdan boşluk bırak
                      }}
                    >
                      {question.title}
                    </Typography>

                    <Box sx={{
                      overflow: 'hidden',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      pr: 10,
                      maxWidth: '100%',
                    }}>
                      <ExpandableMarkdown content={question.content} maxLength={600} maxHeight={420} />
                    </Box>
                  </Box>

                  {/* Thumbnail Container - Dikey olarak ortalanmış */}
                  {(questionThumbnailUrl || question?.thumbnail?.url) && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        alignSelf: 'stretch',
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={(theme) => ({
                          width: 60,
                          height: 60,
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          border: `1px solid ${theme.palette.divider}`,
                          boxShadow: theme.palette.mode === 'dark'
                            ? '0 2px 8px rgba(0,0,0,0.2)'
                            : '0 2px 8px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease',
                          backgroundColor: theme.palette.background.paper,
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        })}
                        onClick={() => setQuestionThumbnailPreviewOpen(true)}
                      >
                        <img
                          src={questionThumbnailUrl || question?.thumbnail?.url || ''}
                          alt={question.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={async (e) => {
                            const img = e.currentTarget;
                            const currentSrc = img.src;

                            // Eğer thumbnail key varsa, yeniden URL oluşturmayı dene (URL expire olmuş olabilir)
                            if (question?.thumbnail?.key) {
                              try {
                                const newUrl = await contentAssetService.resolveAssetUrl({
                                  key: question.thumbnail.key,
                                  type: 'question-thumbnail',
                                  entityId: question.id,
                                });
                                if (newUrl && newUrl !== currentSrc) {
                                  setQuestionThumbnailUrl(newUrl);
                                  img.src = newUrl;
                                  return; // Yeniden yükleme başarılı
                                }
                              } catch (error) {
                                logger.error('Thumbnail URL yeniden oluşturulamadı:', error);
                              }
                            }

                            // Başarısız olursa gizle
                            img.style.display = 'none';
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Tag'ler */}
                {question.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    {question.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={(theme) => {
                          const tagColor = isMagnefite
                            ? (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280') // Gray for Magnefite
                            : theme.palette.primary.main;
                          const tagDark = isMagnefite
                            ? (theme.palette.mode === 'dark' ? '#6B7280' : '#4B5563') // Darker gray for Magnefite
                            : theme.palette.primary.dark;
                          return {
                            borderRadius: 2,
                            borderColor: tagColor,
                            color: tagColor,
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                            '&:hover': {
                              background: `${tagColor}22`,
                              borderColor: tagDark,
                            }
                          };
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* Stats Container - Alt Kısım */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  width: '100%',
                  mt: 2,
                }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      cursor: question.likesCount > 0 ? 'pointer' : 'default',
                      '&:hover': question.likesCount > 0 ? { opacity: 0.7 } : {},
                    }}
                    onClick={question.likesCount > 0 ? handleShowLikedUsersForQuestion : undefined}
                    title={question.likesCount > 0 ? t('users_who_liked', currentLanguage) : ''}
                  >
                    <ThumbUp sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {question.likesCount}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      cursor: question.dislikesCount > 0 ? 'pointer' : 'default',
                      '&:hover': question.dislikesCount > 0 ? { opacity: 0.7 } : {},
                    }}
                    onClick={question.dislikesCount > 0 ? handleShowDislikedUsersForQuestion : undefined}
                    title={question.dislikesCount > 0 ? t('users_who_disliked', currentLanguage) : ''}
                  >
                    <ThumbDown sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {question.dislikesCount}
                    </Typography>
                  </Box>
                  {user && questionRelatedQuestionsCount > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                      }}
                      onClick={(e) => handleShowRelatedQuestions(e as React.MouseEvent<HTMLElement>, question.id, 'question')}
                      title={t('related_questions', currentLanguage)}
                    >
                      <Quiz sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        {questionRelatedQuestionsCount}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </QuestionCard>
        </Box>

        {/* Cevap Yazma Bölümü */}
        {user && (
          <QuestionCard isPapirus={isPapirus} isAnswerWriting={true} isMagnefite={isMagnefite}>
            <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
              {t('write_answer', currentLanguage)}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
              * {t('validation_answer_min', currentLanguage)}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <RichTextEditor
                value={newAnswer}
                onChange={(value) => setNewAnswer((value || '').slice(0, CONTENT_MAX_LENGTH))}
                minHeight={300}
                maxLength={CONTENT_MAX_LENGTH}
                error={!!answerValidationError}
                helperText={answerValidationError}
              />
            </Box>
            <ActionButton
              onClick={handleSubmitAnswer}
              disabled={!newAnswer.trim() || newAnswer.trim().length < 5 || submittingAnswer || newAnswer.length > CONTENT_MAX_LENGTH}
              endIcon={<Send />}
              isMagnefite={isMagnefite}
            >
              {submittingAnswer ? t('sending', currentLanguage) : t('send_answer', currentLanguage)}
            </ActionButton>
          </QuestionCard>
        )}

        {/* Cevaplar */}
        <Box id="answers-section" sx={{ mt: 4 }}>
          <Typography variant="h5" sx={(theme) => ({ mb: 3, color: theme.palette.text.primary, fontWeight: 600 })}>
            {t('answers', currentLanguage)} ({totalAnswers})
          </Typography>

          {answers.length === 0 ? (
            <QuestionCard isPapirus={isPapirus} isMagnefite={isMagnefite}>
              <Typography sx={(theme) => ({ textAlign: 'center', color: theme.palette.text.secondary })}>
                {t('no_data', currentLanguage)}
              </Typography>
            </QuestionCard>
          ) : (
            <>
              {answers.map((answer) => (
                <Box
                  key={answer.id}
                  id={`answer-${answer.id}`}
                >
                  <AnswerCard
                    answer={answer}
                    isAlternateTexture={false}
                    relatedQuestionsCount={relatedQuestionsCount[answer.id] || 0}
                    isHighlighted={highlightedAnswerId === answer.id}
                    onShowRelatedQuestions={(e: React.MouseEvent<Element>, answerId: string) => {
                      handleShowRelatedQuestions(e as React.MouseEvent<HTMLElement>, answerId, 'answer');
                    }}
                    onLike={handleLikeAnswer}
                    onUnlike={handleUnlikeAnswer}
                    onDislike={handleDislikeAnswer}
                    onUndislike={handleUndoDislikeAnswer}
                    onDelete={handleDeleteAnswer}
                    onHelp={handleAskQuestionAboutAnswer}
                    onShowLikedUsers={handleShowLikedUsersForAnswer}
                    onShowDislikedUsers={handleShowDislikedUsersForAnswer}
                    questionId={question.id}
                    questionTitle={question.title}
                    showParentInfo={false}
                  />
                </Box>
              ))}
              {Math.ceil(totalAnswers / answersLimit) > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={Math.ceil(totalAnswers / answersLimit)}
                    page={answersPage}
                    onChange={(_, page) => {
                      setAnswersPage(page);
                      // Scroll to top of answers section
                      const answersSection = document.getElementById('answers-section');
                      if (answersSection) {
                        answersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Container>

      <Dialog
        open={questionThumbnailPreviewOpen}
        onClose={() => setQuestionThumbnailPreviewOpen(false)}
        maxWidth="md"
      >
        {(questionThumbnailUrl || question?.thumbnail?.url || question?.thumbnail?.key) && (
          <Box sx={{ p: 0, m: 0 }}>
            <img
              src={questionThumbnailUrl || question?.thumbnail?.url || ''}
              alt={question?.title || 'Question thumbnail'}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
              onError={async (e) => {
                const img = e.currentTarget;
                const currentSrc = img.src;

                // Eğer thumbnail key varsa, yeniden URL oluşturmayı dene
                if (question?.thumbnail?.key) {
                  try {
                    const newUrl = await contentAssetService.resolveAssetUrl({
                      key: question.thumbnail.key,
                      type: 'question-thumbnail',
                      entityId: question.id,
                    });
                    if (newUrl && newUrl !== currentSrc) {
                      setQuestionThumbnailUrl(newUrl);
                      img.src = newUrl;
                      return;
                    }
                  } catch (error) {
                    logger.error('Thumbnail preview URL yeniden oluşturulamadı:', error);
                  }
                }

                img.style.display = 'none';
              }}
            />
          </Box>
        )}
      </Dialog>

      <CreateQuestionModal
        open={editModalOpen}
        onClose={handleCloseEditQuestionModal}
        onSubmit={handleUpdateQuestion}
        question={editQuestionForm}
        onQuestionChange={handleEditQuestionChange}
        validationErrors={editValidationErrors}
        isSubmitting={updatingQuestion}
        currentLanguage={currentLanguage}
        mode="edit"
        initialThumbnailUrl={questionThumbnailUrl}
      />

      {/* Likes Modal */}
      <LikesModal
        open={likesModalOpen}
        onClose={() => dispatch(closeModal())}
        users={likesModalUsers}
        title={t('users_who_liked', currentLanguage)}
      />

      {/* Dislikes Modal */}
      <LikesModal
        open={dislikesModalOpen}
        onClose={() => dispatch(closeDislikesModal())}
        users={dislikedUsers}
        title={t('users_who_disliked', currentLanguage)}
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

      {/* Ancestors Drawer */}
      {question && question.ancestors && question.ancestors.length > 1 && (
        <AncestorsDrawer
          open={ancestorsDrawerOpen}
          onClose={(event) => {
            if (event) {
              event.stopPropagation();
            }
            setAncestorsDrawerOpen(false);
          }}
          ancestors={question.ancestors || []}
          currentQuestionId={question.id}
          contentType="question"
        />
      )}
    </Layout>
  );
};

export default QuestionDetail; 