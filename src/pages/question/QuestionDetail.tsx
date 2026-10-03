import React, { useState, useEffect, useRef } from 'react';
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
  Tooltip,
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
  ChevronLeft,
  ChevronRight,
  Close,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Layout from '../../components/layout/Layout';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import { Question, UpdateQuestionData, CreateQuestionData, QuestionReference } from '../../types/question';
import type { FeatureTableRow } from '../../types/questionFeatureTemplate';
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
import RelatedQuestionsPopover from '../../components/question/RelatedQuestionsPopover';
import RichTextEditor, { CONTENT_MAX_LENGTH } from '../../components/ui/RichTextEditor';
import {
  QUESTION_SUMMARY_MIN_LENGTH,
  QUESTION_SUMMARY_MAX_LENGTH,
  QUESTION_DETAIL_MIN_LENGTH,
  QUESTION_DETAIL_MAX_LENGTH,
  TAG_MAX_LENGTH,
  TAG_MAX_COUNT,
} from '../../constants/questionValidation';
import ExpandableMarkdown from '../../components/ui/ExpandableMarkdown';
import AncestorsDrawer from '../../components/question/AncestorsDrawer';
import AnswerCard from '../../components/answer/AnswerCard';
import ItemsPerPageSelector, { DateSortOrder, dateSortToApiOrder } from '../../components/home/ItemsPerPageSelector';
import { openModal, closeModal, openDislikesModal, closeDislikesModal } from '../../store/likes/likesSlice';
import { fetchLikedUsers, fetchDislikedUsers } from '../../store/likes/likesThunks';
import { getAnswersByQuestion, createAnswer, likeAnswer, unlikeAnswer, deleteAnswer } from '../../store/answers/answerThunks';
import { updateAnswerInList, removeAnswerFromList } from '../../store/answers/answerSlice';
import CreateQuestionFlow from '../../components/question/CreateQuestionFlow';
import type { CreateQuestionLeftState } from '../../components/question/CreateQuestionLeftModal';
import QuestionDetailLeftPanel, {
  type QuestionDetailFeatureFieldRow,
} from '../../components/question/QuestionDetailLeftPanel';
import QuestionDetailRightPanel from '../../components/question/QuestionDetailRightPanel';
import { contentAssetService, uploadFileToPresignedUrl } from '../../services/contentAssetService';
import { questionFeatureTemplateService } from '../../services/questionFeatureTemplateService';
import {
  FeatureFieldFormValue,
  parseFeatureFieldDefs,
  valuesApiToForm,
  valuesFormToApi,
  formatFeatureFieldSummary,
  formatFeatureFieldDetailText,
  tableRowFromApiToForm,
} from '../../utils/featureTemplateUtils';
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

export type QuestionDetailProps = {
  /** Route param yerine doğrudan soru id (ör. Soruştur sağ panel) */
  questionId?: string;
  /** Layout / geniş minWidth olmadan gömülü gösterim */
  embedded?: boolean;
  /** Gömülü cevap vurgusu (#answer- yerine) */
  highlightAnswerId?: string;
  onClose?: () => void;
};

const QuestionDetail: React.FC<QuestionDetailProps> = ({
  questionId: questionIdProp,
  embedded = false,
  highlightAnswerId: highlightAnswerIdProp,
  onClose,
}) => {
  const theme = useTheme();
  const { id: paramId } = useParams<{ id: string }>();
  const id = questionIdProp || paramId;
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
  const embeddedScrollRef = useRef<HTMLDivElement | null>(null);

  /** Gömülü panelde sadece detay scrollbar'ını kaydır; dış sayfaya dokunma */
  const scrollElementInView = (element: HTMLElement, block: 'center' | 'start' = 'center') => {
    const container = embedded && embeddedScrollRef.current ? embeddedScrollRef.current : null;
    if (container) {
      const elRect = element.getBoundingClientRect();
      const cRect = container.getBoundingClientRect();
      const align =
        block === 'start'
          ? elRect.top - cRect.top - 12
          : elRect.top - cRect.top - cRect.height / 2 + elRect.height / 2;
      container.scrollTo({
        top: Math.max(0, container.scrollTop + align),
        behavior: 'smooth',
      });
      return;
    }
    element.scrollIntoView({ behavior: 'smooth', block });
  };

  // Parent question/answer state
  const [parentQuestion, setParentQuestion] = useState<Question | null>(null);
  const [parentAnswer, setParentAnswer] = useState<Answer | null>(null);
  const [parentAnswerQuestion, setParentAnswerQuestion] = useState<Question | null>(null);

  // Ask question modal states (CreateQuestionFlow - merkezi modal)
  const [askQuestionModalOpen, setAskQuestionModalOpen] = useState(false);
  const [askQuestionMode, setAskQuestionMode] = useState<'question' | 'answer' | null>(null);
  const [targetQuestionId, setTargetQuestionId] = useState<string | null>(null);
  const [targetAnswerId, setTargetAnswerId] = useState<string | null>(null);
  const [askQuestionForm, setAskQuestionForm] = useState({ summary: '', detail: '', category: '', tags: '' });
  const [askQuestionValidationErrors, setAskQuestionValidationErrors] = useState<{ summary?: string; detail?: string; category?: string; tags?: string }>({});
  const [askQuestionSubmitting, setAskQuestionSubmitting] = useState(false);

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
    summary: '',
    detail: '',
    category: '',
    tags: '',
  });
  const [editValidationErrors, setEditValidationErrors] = useState<{
    summary?: string;
    detail?: string;
    category?: string;
    tags?: string;
  }>({});
  const [updatingQuestion, setUpdatingQuestion] = useState(false);
  const [editInitialLeftState, setEditInitialLeftState] = useState<
    CreateQuestionLeftState | undefined
  >(undefined);
  const [featureTemplateDisplayName, setFeatureTemplateDisplayName] = useState<string | null>(null);
  const [featureFieldDisplayRows, setFeatureFieldDisplayRows] = useState<QuestionDetailFeatureFieldRow[]>([]);
  const [questionThumbnailPreviewOpen, setQuestionThumbnailPreviewOpen] = useState(false);
  const [answersPage, setAnswersPage] = useState(1);
  const [answersLimit, setAnswersLimit] = useState(10);
  const [dateSort, setDateSort] = useState<DateSortOrder>('newest');
  const [hoveredRefIndex, setHoveredRefIndex] = useState<number | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [questionProfileImageUrl, setQuestionProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!question?.featureTemplateId) {
      setFeatureTemplateDisplayName(null);
      setFeatureFieldDisplayRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const tpl = await questionFeatureTemplateService.getById(question.featureTemplateId!);
      if (cancelled || !tpl) return;
      setFeatureTemplateDisplayName(tpl.name);
      const defs = parseFeatureFieldDefs(tpl.currentVersion?.fields);
      const vals = question.featureFieldValues ?? {};
      setFeatureFieldDisplayRows(
        defs.map((d) => {
          const raw = vals[d.fieldId];
          const has =
            raw != null &&
            raw !== '' &&
            !(typeof raw === 'string' && raw.trim() === '') &&
            !(Array.isArray(raw) && raw.length === 0);
          if (!has) {
            return { title: d.title, summary: '—', detail: '—' };
          }
          const base: QuestionDetailFeatureFieldRow = {
            title: d.title,
            summary: formatFeatureFieldSummary(d, raw),
            detail: formatFeatureFieldDetailText(d, raw),
          };
          if (d.type === 'table' && d.columns?.length && Array.isArray(raw)) {
            return {
              ...base,
              tableData: {
                columns: d.columns,
                rows: (raw as FeatureTableRow[]).map((row) => tableRowFromApiToForm(row, d.columns!)),
              },
            };
          }
          return base;
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [question?.id, question?.featureTemplateId, question?.featureFieldValues]);

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
          dispatch(getAnswersByQuestion({
            questionId: id,
            page: answersPage,
            limit: answersLimit,
            sortOrder: dateSortToApiOrder(dateSort),
          }))
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
  }, [id, dispatch, answersPage, answersLimit, dateSort]);

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

  const resolveAnswerHighlight = async (answerId: string, clearHash = false) => {
    if (!id) return;
    const pageNumber = await answerService.getAnswerPageNumber(
      id,
      answerId,
      answersLimit
    );
    if (pageNumber) {
      if (pageNumber !== answersPage) {
        setAnswersPage(pageNumber);
        return;
      }
      setHighlightedAnswerId(answerId);
      setTimeout(() => {
        const element = document.getElementById(`answer-${answerId}`);
        if (element) {
          scrollElementInView(element, 'center');
          setTimeout(() => {
            setHighlightedAnswerId(null);
            if (clearHash) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }, 3000);
        }
      }, 100);
    } else {
      setHighlightedAnswerId(null);
    }
  };

  // Hash'ten cevap ID'sini al ve highlight et
  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#answer-')) {
        const answerId = hash.substring('#answer-'.length);
        await resolveAnswerHighlight(answerId, true);
      } else if (!highlightAnswerIdProp) {
        setHighlightedAnswerId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, answersLimit, answersPage]);

  // Gömülü panelden gelen cevap vurgusu
  useEffect(() => {
    if (!highlightAnswerIdProp || !id) return;
    void resolveAnswerHighlight(highlightAnswerIdProp, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightAnswerIdProp, id, answersLimit, answersPage, answers]);

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
            scrollElementInView(element, 'center');

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
        dispatch(getAnswersByQuestion({
          questionId: id,
          page: 1,
          limit: answersLimit,
          sortOrder: dateSortToApiOrder(dateSort),
        }));
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
        dispatch(getAnswersByQuestion({
          questionId: id,
          page: answersPage,
          limit: answersLimit,
          sortOrder: dateSortToApiOrder(dateSort),
        }));
      }
      showErrorToast(t('delete_failed', currentLanguage));
    }
  };

  // Ask question about question/answer handlers
  const handleAskQuestionAboutQuestion = () => {
    if (!question) return;
    setAskQuestionMode('question');
    setTargetQuestionId(question.id);
    setTargetAnswerId(null);
    setAskQuestionForm({ summary: '', detail: '', category: '', tags: '' });
    setAskQuestionValidationErrors({});
    setAskQuestionModalOpen(true);
  };

  const handleAskQuestionAboutAnswer = (answerId: string) => {
    setAskQuestionMode('answer');
    setTargetAnswerId(answerId);
    setTargetQuestionId(null);
    setAskQuestionForm({ summary: '', detail: '', category: '', tags: '' });
    setAskQuestionValidationErrors({});
    setAskQuestionModalOpen(true);
  };

  const handleCloseAskQuestionModal = () => {
    setAskQuestionModalOpen(false);
    setAskQuestionMode(null);
    setTargetQuestionId(null);
    setTargetAnswerId(null);
    setAskQuestionForm({ summary: '', detail: '', category: '', tags: '' });
    setAskQuestionValidationErrors({});
  };

  const handleSubmitRelatedQuestion = async (opt: {
    thumbnailFile?: File | null;
    removeThumbnail?: boolean;
    leftState?: CreateQuestionLeftState;
    rightState?: { references: { type: string; content: string; description: string }[]; metadata: { key: string; value: string }[] };
    attachedFiles?: { id: string; file: File; description: string }[];
  }) => {
    if (!user || !askQuestionMode || !(targetQuestionId || targetAnswerId)) return;

    const { summary, detail, category, tags } = askQuestionForm;
    if (!summary.trim() || !detail.trim()) return;
    if (summary.length < QUESTION_SUMMARY_MIN_LENGTH || summary.length > QUESTION_SUMMARY_MAX_LENGTH) {
      setAskQuestionValidationErrors({
        summary: summary.length < QUESTION_SUMMARY_MIN_LENGTH ? t('validation_summary_min', currentLanguage) : t('validation_summary_max', currentLanguage),
      });
      return;
    }
    if (detail.length < QUESTION_DETAIL_MIN_LENGTH || detail.length > QUESTION_DETAIL_MAX_LENGTH) {
      setAskQuestionValidationErrors({
        detail: detail.length < QUESTION_DETAIL_MIN_LENGTH ? t('validation_detail_min', currentLanguage) : t('validation_detail_max', currentLanguage),
      });
      return;
    }
    const tagsArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagsArray.length > TAG_MAX_COUNT) {
      setAskQuestionValidationErrors({ tags: t('validation_tag_max_count', currentLanguage) });
      return;
    }
    const invalidTag = tagsArray.find((t) => t.length > TAG_MAX_LENGTH);
    if (invalidTag) {
      setAskQuestionValidationErrors({ tags: t('validation_tag_max_chars', currentLanguage) });
      return;
    }

    const soruCevapRefWithoutDesc = opt.rightState?.references?.find(
      (r) => (r.type === 'soru' || r.type === 'cevap') && r.content?.trim() && !r.description?.trim()
    );
    if (soruCevapRefWithoutDesc) {
      showErrorToast(t('reference_description_required', currentLanguage));
      return;
    }

    setAskQuestionSubmitting(true);
    setAskQuestionValidationErrors({});

    try {
      const { thumbnailFile, leftState, rightState, attachedFiles } = opt;
      let thumbnailKey: string | undefined;

      if (thumbnailFile) {
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
        featureTemplateId = leftState.featureTemplateId;
        featureFieldValues = valuesFormToApi(leftState.featureFieldValues, defs);
      }

      const questionData: CreateQuestionData = {
        summary: summary.slice(0, QUESTION_SUMMARY_MAX_LENGTH),
        detail: detail.slice(0, QUESTION_DETAIL_MAX_LENGTH),
        category: category?.trim() || undefined,
        tags: tagsArray.slice(0, TAG_MAX_COUNT).map((tag) => tag.trim().slice(0, TAG_MAX_LENGTH)),
        parent: {
          id: askQuestionMode === 'question' ? targetQuestionId! : targetAnswerId!,
          type: askQuestionMode,
        },
        thumbnailKey,
        visibility: leftState?.visibility ?? true,
        format: leftState?.format || undefined,
        interest: leftState?.interest || undefined,
        focus: leftState?.focus ? parseInt(leftState.focus, 10) : undefined,
        references: mappedReferences,
        metadata: rightState?.metadata?.length ? rightState.metadata : undefined,
        attachments: attachmentKeys,
        ...(featureTemplateId ? { featureTemplateId, featureFieldValues } : {}),
      };

      const newQuestion = await questionService.createQuestion(questionData);
      if (newQuestion) {
        handleCloseAskQuestionModal();
        showSuccessToast(t('question_created', currentLanguage));
        navigate(`/questions/${newQuestion.id}`);
      }
    } catch (err) {
      console.error('Soru oluşturulurken hata:', err);
      showErrorToast(t('error', currentLanguage));
    } finally {
      setAskQuestionSubmitting(false);
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

  const handleOpenEditQuestionModal = async () => {
    if (!question) return;
    let featureTemplateId = '';
    let featureFieldValues: Record<string, FeatureFieldFormValue> = {};
    if (question.featureTemplateId) {
      const tpl = await questionFeatureTemplateService.getById(question.featureTemplateId);
      const defs = tpl?.currentVersion?.fields
        ? parseFeatureFieldDefs(tpl.currentVersion.fields)
        : [];
      featureFieldValues = valuesApiToForm(
        question.featureFieldValues as Record<string, unknown> | undefined,
        defs,
      );
      featureTemplateId = question.featureTemplateId;
    }
    setEditInitialLeftState({
      visibility: question.visibility ?? true,
      format: question.format ?? '',
      interest: question.interest ?? '',
      focus: question.focus != null ? String(question.focus) : '',
      featureTemplateId,
      featureFieldValues,
    });
    setEditQuestionForm({
      summary: question.summary,
      detail: question.detail,
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
    setEditInitialLeftState(undefined);
  };

  const handleEditQuestionChange = (field: string, value: string) => {
    let v = value;
    if (field === 'tags') {
      const tags = v.split(',').map((t) => t.trim().slice(0, TAG_MAX_LENGTH)).filter(Boolean).slice(0, TAG_MAX_COUNT);
      v = tags.join(', ');
      setEditValidationErrors((prev) => {
        if (prev.tags) {
          const { tags: _, ...rest } = prev;
          return rest;
        }
        return prev;
      });
    }
    setEditQuestionForm((prev) => ({
      ...prev,
      [field]: v,
    }));
  };

  const validateEditForm = (): boolean => {
    const errors: typeof editValidationErrors = {};

    if (editQuestionForm.summary.trim().length < QUESTION_SUMMARY_MIN_LENGTH) {
      errors.summary = t('validation_summary_min', currentLanguage);
    } else if (editQuestionForm.summary.length > QUESTION_SUMMARY_MAX_LENGTH) {
      errors.summary = t('validation_summary_max', currentLanguage);
    }

    if (editQuestionForm.detail.trim().length < QUESTION_DETAIL_MIN_LENGTH) {
      errors.detail = t('validation_detail_min', currentLanguage);
    } else if (editQuestionForm.detail.length > QUESTION_DETAIL_MAX_LENGTH) {
      errors.detail = t('validation_detail_max', currentLanguage);
    }

    const tagsArray = editQuestionForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagsArray.length > TAG_MAX_COUNT) {
      errors.tags = t('validation_tag_max_count', currentLanguage);
    } else if (tagsArray.some((t) => t.length > TAG_MAX_LENGTH)) {
      errors.tags = t('validation_tag_max_chars', currentLanguage);
    }

    setEditValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateQuestion = async ({
    thumbnailFile,
    removeThumbnail,
    rightState,
    attachedFiles,
    leftState,
  }: {
    thumbnailFile?: File | null;
    removeThumbnail?: boolean;
    rightState?: { references: { type: string; content: string; description: string }[]; metadata: { key: string; value: string }[] };
    attachedFiles?: { id: string; file: File; description: string }[];
    leftState?: CreateQuestionLeftState;
  }) => {
    if (!question) return;
    if (!validateEditForm()) {
      return;
    }

    const soruCevapRefWithoutDesc = rightState?.references?.find(
      (r) => (r.type === 'soru' || r.type === 'cevap') && r.content?.trim() && !r.description?.trim()
    );
    if (soruCevapRefWithoutDesc) {
      showErrorToast(t('reference_description_required', currentLanguage));
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
        .map((tag) => tag.trim().slice(0, TAG_MAX_LENGTH))
        .filter((tag) => tag.length > 0)
        .slice(0, TAG_MAX_COUNT);

      const updatePayload: UpdateQuestionData = {
        summary: editQuestionForm.summary,
        detail: editQuestionForm.detail.slice(0, QUESTION_DETAIL_MAX_LENGTH),
        category: editQuestionForm.category || undefined,
        tags: tagsArray,
      };

      if (newThumbnailKey) {
        updatePayload.thumbnailKey = newThumbnailKey;
      }

      if (removeThumbnail && !thumbnailFile) {
        updatePayload.removeThumbnail = true;
      }

      if (rightState?.references != null) {
        let newAttachmentKeys: { key: string; description?: string; size?: number }[] = [];
        if (attachedFiles?.length) {
          for (const af of attachedFiles) {
            const presigned = await contentAssetService.createPresignedUpload({
              type: 'question-attachment',
              filename: af.file.name,
              mimeType: af.file.type,
              contentLength: af.file.size,
              ownerId: user!.id,
              entityId: question.id,
              visibility: 'public',
            });
            await uploadFileToPresignedUrl(presigned, af.file);
            newAttachmentKeys.push({ key: presigned.key, description: af.description || undefined, size: af.file.size });
          }
        }
        const mappedReferences = rightState.references.map((ref) => {
          if (ref.type === 'dosya' && ref.content && attachedFiles?.length && newAttachmentKeys?.length) {
            const idx = attachedFiles.findIndex((af) => af.id === ref.content);
            if (idx >= 0 && newAttachmentKeys[idx]) {
              return { ...ref, content: newAttachmentKeys[idx].key };
            }
          }
          return ref;
        }) as QuestionReference[];
        updatePayload.references = mappedReferences;

        const refKeys = mappedReferences.filter((r) => r.type === 'dosya' && r.content).map((r) => r.content);
        const keptExisting = (question.attachments ?? []).filter((a) => refKeys.includes(a.key));
        updatePayload.attachments = [...keptExisting, ...newAttachmentKeys];
      }

      if (rightState?.metadata != null) {
        updatePayload.metadata = rightState.metadata;
      }

      if (leftState?.featureTemplateId) {
        const tpl = await questionFeatureTemplateService.getById(leftState.featureTemplateId);
        const defs = tpl?.currentVersion?.fields
          ? parseFeatureFieldDefs(tpl.currentVersion.fields)
          : [];
        updatePayload.featureTemplateId = leftState.featureTemplateId;
        updatePayload.featureFieldValues = valuesFormToApi(
          leftState.featureFieldValues,
          defs,
        );
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

  const wrapPage = (children: React.ReactNode, fullWidth = false) =>
    embedded ? (
      <Box
        ref={embeddedScrollRef}
        sx={{
          height: '100%',
          overflow: 'auto',
          position: 'relative',
          bgcolor: 'background.default',
          ...getScrollbarSx(theme),
        }}
      >
        {onClose && (
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 30,
              display: 'flex',
              justifyContent: 'flex-end',
              px: 1,
              pt: 1,
              pointerEvents: 'none',
            }}
          >
            <Tooltip title={t('close_panel', currentLanguage)} placement="left">
              <IconButton
                size="small"
                onClick={onClose}
                aria-label={t('close_panel', currentLanguage)}
                sx={{
                  pointerEvents: 'auto',
                  color: theme.palette.text.secondary,
                  bgcolor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: 1,
                  '&:hover': {
                    color: theme.palette.primary.main,
                    bgcolor: `${theme.palette.primary.main}14`,
                  },
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        {children}
      </Box>
    ) : fullWidth ? (
      <Layout fullWidth>{children}</Layout>
    ) : (
      <Layout>{children}</Layout>
    );

  if (loadingQuestion) {
    return wrapPage(
      <Container maxWidth="lg" sx={{ pt: 4, pb: 8, position: 'relative', zIndex: 1 }}>
        <QuestionDetailSkeleton />
      </Container>
    );
  }

  if (error || !question) {
    return wrapPage(
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || t('question_not_found', currentLanguage)}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => (embedded && onClose ? onClose() : navigate('/'))}
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
    );
  }

  return wrapPage(
    <>
      {/* Papyrus Background for Question Detail Page */}
      {isPapirus && (
        <Box
          sx={{
            position: embedded ? 'absolute' : 'fixed',
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

      {/* Üst satır: Sabit tablar | Orta (kaymaz) | Paneller overlay olarak açılır */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          minWidth: embedded ? 0 : 2100,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', overflowX: embedded ? 'hidden' : 'auto', alignItems: 'flex-start', position: 'relative' }}>
          {/* Sol tab - her zaman 40px, panel açıkken overlay */}
          {!embedded && (
          <Box sx={{ width: 40, flexShrink: 0, pt: 4, pb: 4, display: 'flex', alignItems: 'flex-start' }}>
            {!leftPanelOpen && (
              <Tooltip title={t('open_panel', currentLanguage)} placement="right">
                <IconButton
                  onClick={() => setLeftPanelOpen(true)}
                  size="small"
                  sx={{
                    width: 40,
                    height: 80,
                    borderRadius: '0 8px 8px 0',
                    color: theme.palette.text.secondary,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderLeft: 0,
                    boxShadow: 2,
                    '&:hover': { color: theme.palette.primary.main, bgcolor: `${theme.palette.primary.main}11` },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          )}

          {/* Orta - sabit konumda, paneller overlay ile üzerine biner */}
          <Box sx={{ flex: 1, minWidth: embedded ? 0 : 1280, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <Container maxWidth="lg" sx={{ pt: embedded ? 0 : 4, pb: 0, position: 'relative', zIndex: 1, width: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', pb: 4 }}>
              {!embedded && (
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
                  alignSelf: 'flex-start',
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
              )}

              {/* Soru Detayı */}
              <Box sx={{ position: 'relative' }}>
          <QuestionCard isPapirus={isPapirus} isMagnefite={isMagnefite}>
            {/* Action Buttons - Sağ Üst Köşe - Doğrudan QuestionCard içinde */}
            <ActionButtonsContainer className="action-buttons-container">
              <ActionButtons
                targetType="question"
                targetId={question.id}
                targetData={{
                  title: question.summary,
                  content: question.detail,
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
                      {question.summary}
                    </Typography>

                    <Box sx={{
                      overflow: 'hidden',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      pr: 10,
                      maxWidth: '100%',
                    }}>
                      <ExpandableMarkdown
                        content={question.detail}
                        maxLength={600}
                        maxHeight={420}
                        onRefHover={setHoveredRefIndex}
                        onRefClick={(idx) => {
                          setHoveredRefIndex(idx);
                          if (!rightPanelOpen) setRightPanelOpen(true);
                        }}
                        highlightedRefIndex={hoveredRefIndex}
                      />
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
                          alt={question.summary}
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
              </Box>
            </Container>
          </Box>

          {/* Sağ tab - her zaman 40px, panel açıkken overlay */}
          {!embedded && (
          <Box sx={{ width: 40, flexShrink: 0, pt: 4, pb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
            {!rightPanelOpen && (
              <Tooltip title={t('open_panel', currentLanguage)} placement="left">
                <IconButton
                  onClick={() => setRightPanelOpen(true)}
                  size="small"
                  sx={{
                    width: 40,
                    height: 80,
                    borderRadius: '8px 0 0 8px',
                    color: theme.palette.text.secondary,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRight: 0,
                    boxShadow: 2,
                    '&:hover': { color: theme.palette.primary.main, bgcolor: `${theme.palette.primary.main}11` },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          )}

          {/* Sol panel overlay - açıkken orta alanın üzerine biner */}
          {!embedded && leftPanelOpen && (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 320,
                maxHeight: 'calc(100vh - 180px)',
                pt: 4,
                pb: 4,
                pl: 2,
                pr: 1,
                boxSizing: 'border-box',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
                <QuestionDetailLeftPanel
                  question={question}
                  currentLanguage={currentLanguage}
                  featureTemplateName={featureTemplateDisplayName}
                  featureFieldRows={featureFieldDisplayRows}
                />
                <Tooltip title={t('close_panel', currentLanguage)} placement="right">
                  <IconButton
                    onClick={() => setLeftPanelOpen(false)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      color: theme.palette.text.secondary,
                      bgcolor: theme.palette.background.paper,
                      boxShadow: 1,
                      '&:hover': { color: theme.palette.primary.main, bgcolor: `${theme.palette.primary.main}22` },
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}

          {/* Sağ panel overlay - açıkken orta alanın üzerine biner */}
          {!embedded && rightPanelOpen && (
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: 500,
                maxHeight: 'calc(100vh - 180px)',
                pt: 4,
                pb: 4,
                pl: 1,
                pr: 2,
                boxSizing: 'border-box',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
                <QuestionDetailRightPanel
                  question={question}
                  currentLanguage={currentLanguage}
                  answers={answers}
                  highlightedRefIndex={hoveredRefIndex}
                  onRefHover={(idx) => setHoveredRefIndex(idx ?? null)}
                  onRefHighlightClear={() => setHoveredRefIndex(null)}
                />
                <Tooltip title={t('close_panel', currentLanguage)} placement="left">
                  <IconButton
                    onClick={() => setRightPanelOpen(false)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      color: theme.palette.text.secondary,
                      bgcolor: theme.palette.background.paper,
                      boxShadow: 1,
                      '&:hover': { color: theme.palette.primary.main, bgcolor: `${theme.palette.primary.main}22` },
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        </Box>

        {/* Cevaplar - tam genişlik, sabit hizalama (paneller overlay) */}
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', minWidth: embedded ? 0 : 2100 }}>
          {!embedded && <Box sx={{ width: 40, flexShrink: 0 }} />}
          <Box sx={{ flex: 1, minWidth: embedded ? 0 : 1280, display: 'flex', justifyContent: 'center' }}>
            <Container maxWidth="lg" sx={{ pt: 0, pb: 8, position: 'relative', zIndex: 1, width: '100%' }}>
              <Box id="answers-section" sx={{ mt: 4 }}>
                <Typography variant="h5" sx={(theme) => ({ mb: 3, color: theme.palette.text.primary, fontWeight: 600 })}>
                  {t('answers', currentLanguage)} ({totalAnswers})
                </Typography>

                <ItemsPerPageSelector
                  variant="compact"
                  itemsPerPage={answersLimit}
                  totalQuestions={totalAnswers}
                  onItemsPerPageChange={(e) => {
                    setAnswersLimit(parseInt(e.target.value, 10));
                    setAnswersPage(1);
                  }}
                  currentLanguage={currentLanguage}
                  dateSort={dateSort}
                  onDateSortChange={(e) => {
                    setDateSort(e.target.value as DateSortOrder);
                    setAnswersPage(1);
                  }}
                />

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
                          questionSummary={question.summary}
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
                            const answersSection = document.getElementById('answers-section');
                            if (answersSection) {
                              scrollElementInView(answersSection, 'start');
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
          </Box>
          {!embedded && <Box sx={{ width: 40, flexShrink: 0 }} />}
        </Box>
      </Box>

      <Dialog
        open={questionThumbnailPreviewOpen}
        onClose={() => setQuestionThumbnailPreviewOpen(false)}
        maxWidth="md"
      >
        {(questionThumbnailUrl || question?.thumbnail?.url || question?.thumbnail?.key) && (
          <Box sx={{ p: 0, m: 0 }}>
            <img
              src={questionThumbnailUrl || question?.thumbnail?.url || ''}
              alt={question?.summary || 'Question thumbnail'}
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

      <CreateQuestionFlow
        open={editModalOpen}
        onClose={handleCloseEditQuestionModal}
        onSubmit={(opt) =>
          handleUpdateQuestion({
            thumbnailFile: opt.thumbnailFile,
            removeThumbnail: opt.removeThumbnail,
            rightState: opt.rightState,
            attachedFiles: opt.attachedFiles,
            leftState: opt.leftState,
          })
        }
        question={editQuestionForm}
        onQuestionChange={(field, value) => {
          let v = value || '';
          if (field === 'summary') v = v.slice(0, QUESTION_SUMMARY_MAX_LENGTH);
          else if (field === 'detail') v = v.slice(0, QUESTION_DETAIL_MAX_LENGTH);
          else if (field === 'tags') {
            const tags = v.split(',').map((t) => t.trim().slice(0, TAG_MAX_LENGTH)).filter(Boolean).slice(0, TAG_MAX_COUNT);
            v = tags.join(', ');
            if (editValidationErrors.tags) {
              setEditValidationErrors((prev) => {
                const { tags: _t, ...rest } = prev;
                return rest;
              });
            }
          }
          handleEditQuestionChange(field, v);
        }}
        validationErrors={editValidationErrors}
        isSubmitting={updatingQuestion}
        currentLanguage={currentLanguage}
        mode="edit"
        initialThumbnailUrl={questionThumbnailUrl}
        initialLeftState={editInitialLeftState}
        initialRightState={question ? {
          references: (question.references ?? []).map((r) => ({
            type: r.type as 'link' | 'soru' | 'cevap' | 'dosya',
            content: r.content,
            description: r.description ?? '',
          })),
          metadata: question.metadata ?? [],
        } : undefined}
        existingAttachments={question?.attachments ?? []}
        questionId={question?.id}
        ownerId={question?.author?.id}
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

      {/* Ask Question Modal - CreateQuestionFlow (merkezi modal, soru oluşturma ile aynı) */}
      <CreateQuestionFlow
        open={askQuestionModalOpen}
        onClose={handleCloseAskQuestionModal}
        onSubmit={handleSubmitRelatedQuestion}
        question={askQuestionForm}
        onQuestionChange={(field, value) => {
          let v = value || '';
          if (field === 'summary') v = v.slice(0, QUESTION_SUMMARY_MAX_LENGTH);
          else if (field === 'detail') v = v.slice(0, QUESTION_DETAIL_MAX_LENGTH);
          else if (field === 'tags') {
            const tags = v.split(',').map((t) => t.trim().slice(0, TAG_MAX_LENGTH)).filter(Boolean).slice(0, TAG_MAX_COUNT);
            v = tags.join(', ');
            if (askQuestionValidationErrors.tags) {
              setAskQuestionValidationErrors((prev) => {
                const { tags: _t, ...rest } = prev;
                return rest;
              });
            }
          }
          setAskQuestionForm((prev) => ({ ...prev, [field]: v }));
        }}
        validationErrors={askQuestionValidationErrors}
        isSubmitting={askQuestionSubmitting}
        currentLanguage={currentLanguage}
        mode="create"
        aboutQuestion={askQuestionMode === 'question' && targetQuestionId && question ? { id: targetQuestionId, summary: question.summary } : undefined}
        aboutAnswer={askQuestionMode === 'answer' && targetAnswerId ? { id: targetAnswerId, content: answers.find(a => a.id === targetAnswerId)?.content || '' } : undefined}
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
    </>,
    true
  );
};

export default QuestionDetail; 