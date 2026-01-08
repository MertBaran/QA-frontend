import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Alert,
  Fade,
  Tabs,
  Tab,
  Pagination,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Button,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Search as SearchIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import { styled, alpha } from '@mui/material/styles';
import Layout from '../components/layout/Layout';
import { searchService } from '../services/searchService';
import { questionService } from '../services/questionService';
import { Question } from '../types/question';
import { Answer } from '../types/answer';
import { t } from '../utils/translations';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import QuestionCard from '../components/question/QuestionCard';
import AnswerCard from '../components/answer/AnswerCard';
import ItemsPerPageSelector from '../components/home/ItemsPerPageSelector';
import RelatedQuestionsPopover from '../components/question/RelatedQuestionsPopover';
import { SearchPageSkeleton } from '../components/ui/skeleton';
import { likeQuestion, unlikeQuestion } from '../store/questions/questionThunks';
import { likeAnswer, unlikeAnswer } from '../store/answers/answerThunks';
import papyrusVertical1 from '../asset/textures/papyrus_vertical_1.png';

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

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector(state => state.language);
  const { user } = useAppSelector(state => state.auth);
  
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [lastSearchTerm, setLastSearchTerm] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers'>('questions');
  
  // Search mode state (3 mod: phrase, all_words, any_word)
  const [searchMode, setSearchMode] = useState<'phrase' | 'all_words' | 'any_word'>('any_word');
  
  // Match type state (fuzzy/exact - smart kaldırıldı)
  const [matchType, setMatchType] = useState<'fuzzy' | 'exact'>('fuzzy');
  
  // Typo tolerance state (sadece fuzzy modunda aktif)
  const [typoTolerance, setTypoTolerance] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Smart search state (checkbox - açık/kapalı)
  const [smartSearch, setSmartSearch] = useState(false);
  
  // Smart options state (linguistic/semantic) - sadece smartSearch açıkken aktif
  const [smartLinguistic, setSmartLinguistic] = useState(false);
  const [smartSemantic, setSmartSemantic] = useState(true); // Default: semantic seçili
  
  // ELSER model kullanılabilirliği (semantic search için)
  const [elserAvailable, setElserAvailable] = useState<boolean | null>(null); // null = henüz kontrol edilmedi
  
  // Pagination state
  const [questionsPage, setQuestionsPage] = useState(1);
  const [answersPage, setAnswersPage] = useState(1);
  const [questionsItemsPerPage, setQuestionsItemsPerPage] = useState(10);
  const [answersItemsPerPage, setAnswersItemsPerPage] = useState(10);
  const [questionsPagination, setQuestionsPagination] = useState<any>(null);
  const [answersPagination, setAnswersPagination] = useState<any>(null);
  
  // Related questions state
  const [relatedQuestionsCount, setRelatedQuestionsCount] = useState<Record<string, number>>({});
  const [relatedQuestionsAnchor, setRelatedQuestionsAnchor] = useState<HTMLElement | null>(null);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);
  const [loadingRelatedQuestions, setLoadingRelatedQuestions] = useState(false);
  const [currentRelatedTargetId, setCurrentRelatedTargetId] = useState<string | null>(null);
  const [currentRelatedMode, setCurrentRelatedMode] = useState<'question' | 'answer' | null>(null);
  
  // Kelime sayısını hesapla
  const wordCount = searchTerm.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isSingleWord = wordCount === 1;

  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    
    // searchOptions'ı query parametrelerinden oku
    const urlSearchMode = (searchParams.get('searchMode') as 'phrase' | 'all_words' | 'any_word' | null) || 'any_word';
    const urlMatchTypeRaw = searchParams.get('matchType');
    // Eski 'smart' değerini handle et - artık smartSearch checkbox'ı kullanılıyor
    const urlMatchType = (urlMatchTypeRaw === 'smart' ? 'fuzzy' : (urlMatchTypeRaw as 'fuzzy' | 'exact' | null)) || 'fuzzy';
    const urlTypoTolerance = (searchParams.get('typoTolerance') as 'low' | 'medium' | 'high' | null) || 'medium';
    // Eski 'smart' matchType varsa smartSearch'i otomatik aç
    const urlSmartSearch = searchParams.get('smartSearch') === 'true' || urlMatchTypeRaw === 'smart';
    const urlSmartLinguistic = searchParams.get('smartLinguistic') === 'true';
    const urlSmartSemantic = searchParams.get('smartSemantic') === 'true';
    
    // URL'den gelen değerleri state'e aktar
    setSearchTerm(urlQuery);
    setSearchMode(urlSearchMode);
    setMatchType(urlMatchType);
    setTypoTolerance(urlTypoTolerance);
    setSmartSearch(urlSmartSearch);
    setSmartLinguistic(urlSmartLinguistic);
    setSmartSemantic(urlSmartSemantic);
    
    // URL'de query varsa ve minimum 3 karakter ise arama yap
    const trimmedUrlQuery = urlQuery.trim();
    if (trimmedUrlQuery && trimmedUrlQuery.length >= 3) {
      // Reset pagination when search term changes (or when _t parameter changes for same term)
      const timestampParam = searchParams.get('_t');
      if (lastSearchTerm !== trimmedUrlQuery || timestampParam) {
      setQuestionsPage(1);
      setAnswersPage(1);
        setLastSearchTerm(trimmedUrlQuery);
      }
      // Smart search açıksa otomatik olarak sadece linguistic aktif (semantic false)
      const finalSmartOpts = urlSmartSearch 
        ? { linguistic: true, semantic: false }
        : undefined;
      
      performSearch(trimmedUrlQuery, urlSearchMode, urlMatchType, urlTypoTolerance, urlSmartSearch, finalSmartOpts);
    } else if (trimmedUrlQuery && trimmedUrlQuery.length > 0 && trimmedUrlQuery.length < 3) {
      // 3 karakterden azsa hata göster
      setError(t('min_search_length', currentLanguage) || 'Arama için en az 3 karakter girmelisiniz.');
      setQuestions([]);
      setAnswers([]);
      setQuestionsPagination(null);
      setAnswersPagination(null);
    } else {
      setQuestions([]);
      setAnswers([]);
      setQuestionsPagination(null);
      setAnswersPagination(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, searchParams.get('_t')]);


  const performSearch = async (
    term: string,
    mode: 'phrase' | 'all_words' | 'any_word' = 'any_word',
    match: 'fuzzy' | 'exact' = 'fuzzy',
    tolerance: 'low' | 'medium' | 'high' = 'medium',
    smart: boolean = false,
    smartOpts?: { linguistic?: boolean; semantic?: boolean },
    customQuestionsPage?: number,
    customQuestionsItemsPerPage?: number,
    customAnswersPage?: number,
    customAnswersItemsPerPage?: number,
    shouldUpdateActiveTab: boolean = true // Sayfa değişikliğinde false olmalı
  ) => {
    const trimmedTerm = term.trim();
    // Minimum 3 karakter kontrolü
    if (!trimmedTerm || trimmedTerm.length < 3) {
      setQuestions([]);
      setAnswers([]);
      setQuestionsPagination(null);
      setAnswersPagination(null);
      if (trimmedTerm.length > 0 && trimmedTerm.length < 3) {
        setError(t('min_search_length', currentLanguage) || 'Arama için en az 3 karakter girmelisiniz.');
      } else {
        setError(null);
      }
      return;
    }

    setLoading(true);
    setError(null);

    // Custom değerler varsa onları kullan, yoksa state'ten al
    const qPage = customQuestionsPage !== undefined ? customQuestionsPage : questionsPage;
    const qItemsPerPage = customQuestionsItemsPerPage !== undefined ? customQuestionsItemsPerPage : questionsItemsPerPage;
    const aPage = customAnswersPage !== undefined ? customAnswersPage : answersPage;
    const aItemsPerPage = customAnswersItemsPerPage !== undefined ? customAnswersItemsPerPage : answersItemsPerPage;

    // Smart search açıksa otomatik olarak sadece linguistic aktif (semantic false)
    const finalSmartOpts = smart ? { linguistic: true, semantic: false } : undefined;

    try {
      const results = await searchService.searchAll(
        term, 
        qPage,
        qItemsPerPage,
        aPage,
        aItemsPerPage,
        mode,
        match,
        tolerance,
        smart,
        finalSmartOpts,
        currentLanguage
      );
      setQuestions(results.questions);
      setAnswers(results.answers);
      setQuestionsPagination(results.questionsPagination);
      setAnswersPagination(results.answersPagination);
      
      // Smart modunda sadece dilsel arama kullanıldığı için semantic kontrolü yok
      
      // Aktif tab'ı ayarla (sadece yeni arama yapıldığında, sayfa değişikliğinde değil)
      if (shouldUpdateActiveTab) {
        if (results.answers.length > 0) {
          // Cevaplar varsa ve sorular yoksa cevaplar sekmesini göster
          if (results.questions.length === 0) {
            setActiveTab('answers');
          } else {
            // Her ikisi de varsa, sorular sekmesinde başla
            setActiveTab('questions');
          }
        } else if (results.questions.length > 0) {
          setActiveTab('questions');
        }
      }
    } catch (err: any) {
      console.error('Arama hatası:', err);
      
      // Hata durumunda normal hata mesajını göster
      setError(err.message || t('search_error', currentLanguage));
      
      setQuestions([]);
      setAnswers([]);
      setQuestionsPagination(null);
      setAnswersPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSearchTerm = searchTerm.trim();
    // Minimum 3 karakter kontrolü
    if (trimmedSearchTerm.length < 3) {
      setError(t('min_search_length', currentLanguage) || 'Arama için en az 3 karakter girmelisiniz.');
      return;
    }
    if (trimmedSearchTerm) {
      setError(null); // Hata mesajını temizle
      const params = new URLSearchParams(searchParams);
      const currentQuery = params.get('q');
      
      // Eğer aynı kelime için tekrar arama yapılıyorsa, timestamp ekle
      if (currentQuery === trimmedSearchTerm) {
        params.set('_t', Date.now().toString());
      }
      
      params.set('q', trimmedSearchTerm);
      // includeAnswers artık kullanılmıyor, her zaman cevapları dahil ediyoruz
      params.delete('includeAnswers'); // Eski parametreyi temizle
      
      // searchOptions parametrelerini ayrı ayrı ekle
      if (searchMode !== 'any_word') {
        params.set('searchMode', searchMode);
      } else {
        params.delete('searchMode');
      }
      if (matchType !== 'fuzzy') {
        params.set('matchType', matchType);
      } else {
        params.delete('matchType');
      }
      
      // Typo toleransı (sadece fuzzy modunda)
      if (matchType === 'fuzzy' && typoTolerance !== 'medium') {
        params.set('typoTolerance', typoTolerance);
      } else {
        params.delete('typoTolerance');
      }
      
      // Akıllı arama (checkbox) - açıksa otomatik olarak sadece linguistic aktif
      if (smartSearch) {
        params.set('smartSearch', 'true');
        params.set('smartLinguistic', 'true'); // Otomatik olarak linguistic aktif
        params.delete('smartSemantic'); // Semantic her zaman false
      } else {
        params.delete('smartSearch');
        params.delete('smartLinguistic');
        params.delete('smartSemantic');
      }
      
      navigate(`/search?${params.toString()}`);
      // performSearch çağrılmayacak, useEffect URL değişikliğini yakalayacak
    }
  };

  const handleSearchModeChange = (newMode: 'phrase' | 'all_words' | 'any_word') => {
    setSearchMode(newMode);
    // URL'i güncelleme, sadece state'i güncelle - arama form submit'te yapılacak
  };

  const handleMatchTypeChange = (newMatchType: 'fuzzy' | 'exact') => {
    setMatchType(newMatchType);
    // Typo toleransı sadece fuzzy modunda aktif
    if (newMatchType === 'exact') {
      // Exact modunda tolerans görünmez
    }
    // URL'i güncelleme, sadece state'i güncelle - arama form submit'te yapılacak
  };

  const handleTypoToleranceChange = (newTolerance: 'low' | 'medium' | 'high') => {
    setTypoTolerance(newTolerance);
    // URL'i güncelleme, sadece state'i güncelle - arama form submit'te yapılacak
  };

  const handleSmartSearchChange = (checked: boolean) => {
    setSmartSearch(checked);
    // Akıllı arama açıldığında otomatik olarak sadece linguistic aktif (semantic false)
    if (checked) {
      setSmartLinguistic(true);
      setSmartSemantic(false);
    } else {
      // Akıllı arama kapatıldığında smart options'ı da temizle
      setSmartLinguistic(false);
      setSmartSemantic(false);
    }
    // URL'i güncelleme, sadece state'i güncelle - arama form submit'te yapılacak
  };


  const updateURL = () => {
    const params = new URLSearchParams(searchParams);
    params.set('q', searchTerm.trim());
    // includeAnswers artık kullanılmıyor, her zaman cevapları dahil ediyoruz
    params.delete('includeAnswers'); // Eski parametreyi temizle
    
    // searchOptions parametrelerini ayrı ayrı ekle
    if (searchMode !== 'any_word') {
      params.set('searchMode', searchMode);
    } else {
      params.delete('searchMode');
    }
    if (matchType !== 'fuzzy') {
      params.set('matchType', matchType);
    } else {
      params.delete('matchType');
    }
    
    // Typo toleransı (sadece fuzzy modunda)
    if (matchType === 'fuzzy' && typoTolerance !== 'medium') {
      params.set('typoTolerance', typoTolerance);
    } else {
      params.delete('typoTolerance');
    }
    
    // Akıllı arama (checkbox)
    if (smartSearch) {
      params.set('smartSearch', 'true');
      if (smartLinguistic) {
        params.set('smartLinguistic', 'true');
      } else {
        params.delete('smartLinguistic');
      }
      if (smartSemantic) {
        params.set('smartSemantic', 'true');
      } else {
        params.delete('smartSemantic');
      }
    } else {
      params.delete('smartSearch');
      params.delete('smartLinguistic');
      params.delete('smartSemantic');
    }
    
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  const handleAnswerClick = (answer: Answer) => {
    if (answer.questionId) {
      navigate(`/questions/${answer.questionId}#answer-${answer.id}`, {
        state: { from: location.pathname + location.search }
      });
    }
  };

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

  const handleShowRelatedQuestions = async (event: React.MouseEvent<HTMLElement>, answerId: string) => {
    setRelatedQuestionsAnchor(event.currentTarget);
    setCurrentRelatedTargetId(answerId);
    setCurrentRelatedMode('answer');
    setLoadingRelatedQuestions(true);
    
    try {
      const questions = await questionService.getQuestionsByParent(answerId);
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
    navigate(`/questions/${questionId}`);
    setRelatedQuestionsAnchor(null);
  };

  const handleLikeAnswer = async (answerId: string) => {
    const answer = answers.find(a => a.id === answerId);
    if (!answer || !answer.questionId || !user) return;

    // Optimistic update
    const wasDisliked = answer.dislikedByUsers.includes(user.id);
    setAnswers(prevAnswers =>
      prevAnswers.map(a =>
        a.id === answerId
          ? {
              ...a,
              likesCount: a.likesCount + 1,
              likedByUsers: [...a.likedByUsers, user.id],
              // Remove from dislikes if exists
              dislikesCount: wasDisliked ? Math.max(0, a.dislikesCount - 1) : a.dislikesCount,
              dislikedByUsers: a.dislikedByUsers.filter(id => id !== user.id),
            }
          : a
      )
    );

    try {
      await dispatch(likeAnswer({ answerId, questionId: answer.questionId })).unwrap();
    } catch (error) {
      // Revert on error
      setAnswers(prevAnswers =>
        prevAnswers.map(a =>
          a.id === answerId
            ? {
                ...a,
                likesCount: Math.max(0, a.likesCount - 1),
                likedByUsers: a.likedByUsers.filter(id => id !== user.id),
                // Restore dislike if it was there
                dislikesCount: wasDisliked ? a.dislikesCount + 1 : a.dislikesCount,
                dislikedByUsers: wasDisliked ? [...a.dislikedByUsers, user.id] : a.dislikedByUsers,
              }
            : a
        )
      );
    }
  };

  const handleUnlikeAnswer = async (answerId: string) => {
    const answer = answers.find(a => a.id === answerId);
    if (!answer || !answer.questionId || !user) return;

    // Optimistic update
    setAnswers(prevAnswers =>
      prevAnswers.map(a =>
        a.id === answerId
          ? {
              ...a,
              likesCount: Math.max(0, a.likesCount - 1),
              likedByUsers: a.likedByUsers.filter(id => id !== user.id),
            }
          : a
      )
    );

    try {
      await dispatch(unlikeAnswer({ answerId, questionId: answer.questionId })).unwrap();
    } catch (error) {
      // Revert on error
      setAnswers(prevAnswers =>
        prevAnswers.map(a =>
          a.id === answerId
            ? {
                ...a,
                likesCount: a.likesCount + 1,
                likedByUsers: [...a.likedByUsers, user.id],
              }
            : a
        )
      );
    }
  };

  // Pagination handlers
  const handleQuestionsPageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setQuestionsPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Sayfa değiştiğinde arama yap (yeni sayfa numarasını direkt kullan)
    // Aktif tab'ı değiştirme (shouldUpdateActiveTab: false)
    const trimmedSearchTerm = searchTerm.trim();
    if (trimmedSearchTerm && trimmedSearchTerm.length >= 3) {
      performSearch(
        trimmedSearchTerm, 
        searchMode, 
        matchType, 
        typoTolerance,
        smartSearch,
        smartSearch ? { linguistic: smartLinguistic, semantic: smartSemantic } : undefined,
        page, // Yeni sayfa numarası
        questionsItemsPerPage,
        answersPage,
        answersItemsPerPage,
        false // Aktif tab'ı değiştirme
      );
    }
  };

  const handleAnswersPageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setAnswersPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Sayfa değiştiğinde arama yap (yeni sayfa numarasını direkt kullan)
    // Aktif tab'ı değiştirme (shouldUpdateActiveTab: false)
    if (searchTerm.trim()) {
      performSearch(
        searchTerm, 
        searchMode, 
        matchType, 
        typoTolerance,
        smartSearch,
        smartSearch ? { linguistic: smartLinguistic, semantic: smartSemantic } : undefined,
        questionsPage,
        questionsItemsPerPage,
        page, // Yeni sayfa numarası
        answersItemsPerPage,
        false // Aktif tab'ı değiştirme
      );
    }
  };

  const handleQuestionsItemsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value);
    setQuestionsItemsPerPage(newItemsPerPage);
    setQuestionsPage(1); // Reset to first page
    // Items per page değiştiğinde arama yap (yeni değerleri direkt kullan)
    // Aktif tab'ı değiştirme (shouldUpdateActiveTab: false)
    if (searchTerm.trim()) {
      performSearch(
        searchTerm, 
        searchMode, 
        matchType, 
        typoTolerance,
        smartSearch,
        smartSearch ? { linguistic: smartLinguistic, semantic: smartSemantic } : undefined,
        1, // Reset to page 1
        newItemsPerPage, // Yeni items per page
        answersPage,
        answersItemsPerPage,
        false // Aktif tab'ı değiştirme
      );
    }
  };

  const handleAnswersItemsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value);
    setAnswersItemsPerPage(newItemsPerPage);
    setAnswersPage(1); // Reset to first page
    // Items per page değiştiğinde arama yap (yeni değerleri direkt kullan)
    // Aktif tab'ı değiştirme (shouldUpdateActiveTab: false)
    if (searchTerm.trim()) {
      performSearch(
        searchTerm, 
        searchMode, 
        matchType, 
        typoTolerance,
        smartSearch,
        smartSearch ? { linguistic: smartLinguistic, semantic: smartSemantic } : undefined,
        questionsPage,
        questionsItemsPerPage,
        1, // Reset to page 1
        newItemsPerPage, // Yeni items per page
        false // Aktif tab'ı değiştirme
      );
    }
  };


  const { name: themeName, mode } = useAppSelector(state => state.theme);
  const isPapirus = themeName === 'papirus';

  const handleLikeQuestion = async (questionId: string) => {
    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;
      const isLiked = question.likedByUsers.includes(user?.id || '');

      if (isLiked) {
        await dispatch(unlikeQuestion(questionId)).unwrap();
      } else {
        await dispatch(likeQuestion(questionId)).unwrap();
      }
      
      // Update local state
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              likedByUsers: isLiked 
                ? q.likedByUsers.filter(id => id !== user?.id)
                : [...q.likedByUsers, user?.id || ''],
              likesCount: isLiked ? q.likesCount - 1 : q.likesCount + 1
            }
          : q
      ));
    } catch (error) {
      console.error('Failed to like/unlike question:', error);
    }
  };

  const handleUnlikeQuestion = async (questionId: string) => {
    await handleLikeQuestion(questionId);
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {t('search', currentLanguage)}
          </Typography>
          
          <form onSubmit={handleSearch}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                placeholder={t('search_placeholder', currentLanguage) || 'Sorularda ve cevaplarda ara...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="submit"
                        edge="end"
                        disabled={!searchTerm.trim() || searchTerm.trim().length < 3}
                        sx={{ mr: -1 }}
                      >
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            
            {/* Arama Modu, Eşleşme Tipi ve Akıllı Arama - 3 Bölüm */}
            {searchTerm.trim() && searchTerm.trim().length >= 3 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {/* 1. Arama Modu - Sol */}
                  <FormControl component="fieldset" sx={{ flex: 1 }}>
                    <FormLabel component="legend" sx={{ mb: 1 }}>
                      {t('search_mode', currentLanguage)}
                    </FormLabel>
                    <RadioGroup
                      row
                      value={searchMode}
                      onChange={(e) => handleSearchModeChange(e.target.value as 'phrase' | 'all_words' | 'any_word')}
                    >
                      <FormControlLabel value="phrase" control={<Radio />} label={t('search_mode_phrase', currentLanguage)} />
                      <FormControlLabel value="all_words" control={<Radio />} label={t('search_mode_all_words', currentLanguage)} />
                      <FormControlLabel value="any_word" control={<Radio />} label={t('search_mode_any_word', currentLanguage)} />
                    </RadioGroup>
                  </FormControl>

                  {/* 2. Eşleşme Tipi - Orta */}
                  <FormControl component="fieldset" sx={{ flex: 1 }}>
                    <FormLabel component="legend" sx={{ mb: 1 }}>
                      {t('match_type', currentLanguage)}
                    </FormLabel>
                    <RadioGroup
                      row
                      value={matchType}
                      onChange={(e) => handleMatchTypeChange(e.target.value as 'fuzzy' | 'exact')}
                    >
                      <FormControlLabel 
                        value="fuzzy" 
                        control={<Radio />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{t('match_type_fuzzy', currentLanguage)}</span>
                            <Tooltip title={t('match_type_fuzzy_tooltip', currentLanguage)} arrow>
                              <InfoIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
                            </Tooltip>
                          </Box>
                        } 
                      />
                      <FormControlLabel value="exact" control={<Radio />} label={t('match_type_exact', currentLanguage)} />
                    </RadioGroup>
                    
                    {/* Typo Toleransı (sadece fuzzy modunda görünür) */}
                    {matchType === 'fuzzy' && (
                      <Box sx={{ mt: 2 }}>
                        <FormLabel component="legend" sx={{ mb: 1 }}>
                          {t('typo_tolerance', currentLanguage) || 'Typo Toleransı'}
                        </FormLabel>
                        <RadioGroup
                          row
                          value={typoTolerance}
                          onChange={(e) => handleTypoToleranceChange(e.target.value as 'low' | 'medium' | 'high')}
                        >
                          <FormControlLabel 
                            value="low" 
                            control={<Radio />} 
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span>{t('typo_tolerance_low', currentLanguage) || 'Düşük'}</span>
                                <Tooltip title={t('typo_tolerance_low_tooltip', currentLanguage) || 'İlk 3 karakter kesin doğru, maksimum 1 karakter hatası'} arrow>
                                  <InfoIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
                                </Tooltip>
                              </Box>
                            } 
                          />
                          <FormControlLabel 
                            value="medium" 
                            control={<Radio />} 
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span>{t('typo_tolerance_medium', currentLanguage) || 'Orta'}</span>
                                <Tooltip title={t('typo_tolerance_medium_tooltip', currentLanguage) || 'İlk 2 karakter kesin doğru, maksimum 2 karakter hatası'} arrow>
                                  <InfoIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
                                </Tooltip>
                              </Box>
                            } 
                          />
                          <FormControlLabel 
                            value="high" 
                            control={<Radio />} 
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span>{t('typo_tolerance_high', currentLanguage) || 'Yüksek'}</span>
                                <Tooltip title={t('typo_tolerance_high_tooltip', currentLanguage) || 'İlk 1 karakter kesin doğru, maksimum 2 karakter hatası'} arrow>
                                  <InfoIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
                                </Tooltip>
                              </Box>
                            } 
                          />
                        </RadioGroup>
                      </Box>
                    )}
                  </FormControl>

                  {/* 3. Akıllı Arama - Sağ */}
                  <FormControl component="fieldset" sx={{ flex: 1 }}>
                    <FormLabel component="legend" sx={{ mb: 1 }}>
                      {t('smart_search', currentLanguage) || 'Akıllı Arama'}
                    </FormLabel>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={smartSearch}
                          onChange={(e) => handleSmartSearchChange(e.target.checked)}
                        />
                      }
                      label={t('smart_search', currentLanguage) || 'Akıllı Arama'}
                    />
                  </FormControl>
                </Box>
              </Box>
            )}
            
            {/* Cevapları Dahil Et - Artık checkbox yok, arama sonuçlarına göre otomatik gösteriliyor */}
          </form>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <SearchPageSkeleton />
        ) : (
          <>
            {questions.length === 0 && answers.length === 0 && searchTerm.trim() && !loading && (
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  backgroundColor: (theme) => theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.info.main, 0.1)
                    : alpha(theme.palette.info.main, 0.08),
                  color: (theme) => theme.palette.mode === 'dark'
                    ? theme.palette.info.light
                    : theme.palette.info.dark,
                  border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                  ...(isPapirus ? {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${papyrusVertical1})`,
                      backgroundSize: '125%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: mode === 'dark' ? 0.08 : 0.1,
                      pointerEvents: 'none',
                      zIndex: 0,
                    },
                    position: 'relative',
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  } : {}),
                }}
              >
                {t('no_results', currentLanguage)}
              </Alert>
            )}

            {(questions.length > 0 || answers.length > 0) && (
              <Box sx={{ mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab
                    label={`${t('questions', currentLanguage)} (${questionsPagination?.total || questions.length})`}
                    value="questions"
                    disabled={questions.length === 0}
                  />
                  {answers.length > 0 && (
                    <Tab
                      label={`${t('answers', currentLanguage)} (${answersPagination?.total || answers.length})`}
                      value="answers"
                      disabled={answers.length === 0}
                    />
                  )}
                </Tabs>
              </Box>
            )}

            {activeTab === 'questions' && questions.length > 0 && (
              <>
                <ItemsPerPageSelector
                  itemsPerPage={questionsItemsPerPage}
                  totalQuestions={questionsPagination?.total || questions.length}
                  onItemsPerPageChange={handleQuestionsItemsPerPageChange}
                  currentLanguage={currentLanguage}
                />
                <Box>
                  {questions.map((question: Question, index: number) => (
                    <Fade in timeout={800 + index * 200} key={question.id}>
                      <QuestionCard
                        question={question}
                        isAlternateTexture={index % 2 === 1}
                      />
                    </Fade>
                  ))}
                </Box>
                {questionsPagination && questionsPagination.totalPages > 1 && (
                  <PaginationContainer isPapirus={isPapirus}>
                    <Pagination
                      count={questionsPagination.totalPages}
                      page={questionsPage}
                      onChange={handleQuestionsPageChange}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                      sx={(theme: any) => ({
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
            )}

            {activeTab === 'answers' && answers.length > 0 && (
              <>
                <ItemsPerPageSelector
                  itemsPerPage={answersItemsPerPage}
                  totalQuestions={answersPagination?.total || answers.length}
                  onItemsPerPageChange={handleAnswersItemsPerPageChange}
                  currentLanguage={currentLanguage}
                />
                <Box>
                  {answers.map((answer: Answer, index: number) => (
                    <Fade in timeout={800 + index * 200} key={answer.id}>
                      <AnswerCard
                        answer={answer}
                        isAlternateTexture={index % 2 === 1}
                        relatedQuestionsCount={relatedQuestionsCount[answer.id] || 0}
                        onShowRelatedQuestions={(e: React.MouseEvent<Element>, answerId: string) => {
                          handleShowRelatedQuestions(e as React.MouseEvent<HTMLElement>, answerId);
                        }}
                      />
                    </Fade>
                  ))}
                </Box>
                {answersPagination && answersPagination.totalPages > 1 && (
                  <PaginationContainer isPapirus={isPapirus}>
                    <Pagination
                      count={answersPagination.totalPages}
                      page={answersPage}
                      onChange={handleAnswersPageChange}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                      sx={(theme: any) => ({
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
            )}

            {activeTab === 'questions' && questions.length === 0 && searchTerm.trim() && !loading && (
              <Alert 
                severity="info"
                sx={{
                  backgroundColor: (theme) => theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.info.main, 0.1)
                    : alpha(theme.palette.info.main, 0.08),
                  color: (theme) => theme.palette.mode === 'dark'
                    ? theme.palette.info.light
                    : theme.palette.info.dark,
                  border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                  ...(isPapirus ? {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${papyrusVertical1})`,
                      backgroundSize: '125%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: mode === 'dark' ? 0.08 : 0.1,
                      pointerEvents: 'none',
                      zIndex: 0,
                    },
                    position: 'relative',
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  } : {}),
                }}
              >
                {t('no_results', currentLanguage)}
              </Alert>
            )}

            {activeTab === 'answers' && answers.length === 0 && searchTerm.trim() && !loading && (
              <Alert 
                severity="info"
                sx={{
                  backgroundColor: (theme) => theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.info.main, 0.1)
                    : alpha(theme.palette.info.main, 0.08),
                  color: (theme) => theme.palette.mode === 'dark'
                    ? theme.palette.info.light
                    : theme.palette.info.dark,
                  border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                  ...(isPapirus ? {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(${papyrusVertical1})`,
                      backgroundSize: '125%',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: mode === 'dark' ? 0.08 : 0.1,
                      pointerEvents: 'none',
                      zIndex: 0,
                    },
                    position: 'relative',
                    '& > *': {
                      position: 'relative',
                      zIndex: 1,
                    },
                  } : {}),
                }}
              >
                {t('no_results', currentLanguage)}
              </Alert>
            )}
          </>
        )}
      </Container>

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

export default Search;
