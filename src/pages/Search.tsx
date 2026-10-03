import React, { useState, useEffect, useRef } from 'react';
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  InfoOutlined as InfoIcon,
  FilterList,
} from '@mui/icons-material';
import Tooltip from '@mui/material/Tooltip';
import { styled, alpha } from '@mui/material/styles';
import Layout from '../components/layout/Layout';
import { searchService, SearchUserHit } from '../services/searchService';
import { questionService } from '../services/questionService';
import { Question } from '../types/question';
import { Answer } from '../types/answer';
import { t } from '../utils/translations';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import QuestionCard from '../components/question/QuestionCard';
import AnswerCard from '../components/answer/AnswerCard';
import ItemsPerPageSelector, { DateSortOrder, dateSortToApiOrder } from '../components/home/ItemsPerPageSelector';
import ActiveFilters from '../components/home/ActiveFilters';
import FilterModal from '../components/ui/FilterModal';
import RelatedQuestionsPopover from '../components/question/RelatedQuestionsPopover';
import { SearchPageSkeleton } from '../components/ui/skeleton';
import ProfileAvatar from '../components/ui/ProfileAvatar';
import { likeQuestion, unlikeQuestion } from '../store/questions/questionThunks';
import { likeAnswer, unlikeAnswer } from '../store/answers/answerThunks';
import {
  updateFilter,
  setActiveFilters,
  clearFilters,
  setFilterModalOpen,
} from '../store/home/homeSlice';
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
  const { filters, activeFilters, filterModalOpen } = useAppSelector(state => state.home);
  const { items: bookmarks } = useAppSelector(state => state.bookmarks);
  
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [lastSearchTerm, setLastSearchTerm] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [users, setUsers] = useState<SearchUserHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'questions' | 'answers' | 'users'>('questions');
  
  // Search mode state (3 mod: phrase, all_words, any_word) — default: all_words
  const [searchMode, setSearchMode] = useState<'phrase' | 'all_words' | 'any_word'>('all_words');
  
  // Match type state (fuzzy/exact - smart kaldırıldı)
  const [matchType, setMatchType] = useState<'fuzzy' | 'exact'>('fuzzy');
  
  // Typo tolerance state (sadece fuzzy modunda aktif) — default: low
  const [typoTolerance, setTypoTolerance] = useState<'low' | 'medium' | 'high'>('low');
  
  /** Canlı öncesi kapalı — synonym/semantic henüz hazır değil */
  const SMART_SEARCH_ENABLED = false;

  // Smart search state (checkbox - açık/kapalı)
  const [smartSearch, setSmartSearch] = useState(false);

  // Takip ettiklerimde ara — giriş yapmış kullanıcıda varsayılan açık
  const [followingOnly, setFollowingOnly] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      setFollowingOnly(false);
      return;
    }
    // URL açıkça false demediyse giriş sonrası default açık kalsın
    if (searchParams.get('followingOnly') !== 'false') {
      setFollowingOnly(true);
    }
  }, [user, searchParams]);
  
  // Smart options state (linguistic/semantic) - sadece smartSearch açıkken aktif
  const [smartLinguistic, setSmartLinguistic] = useState(false);
  const [smartSemantic, setSmartSemantic] = useState(true); // Default: semantic seçili
  
  // ELSER model kullanılabilirliği (semantic search için)
  const [elserAvailable, setElserAvailable] = useState<boolean | null>(null); // null = henüz kontrol edilmedi
  
  // Pagination state
  const [questionsPage, setQuestionsPage] = useState(1);
  const [answersPage, setAnswersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [questionsItemsPerPage, setQuestionsItemsPerPage] = useState(10);
  const [answersItemsPerPage, setAnswersItemsPerPage] = useState(10);
  const [usersItemsPerPage, setUsersItemsPerPage] = useState(10);
  const [dateSort, setDateSort] = useState<DateSortOrder>('newest');
  const [questionsPagination, setQuestionsPagination] = useState<any>(null);
  const [answersPagination, setAnswersPagination] = useState<any>(null);
  const [usersPagination, setUsersPagination] = useState<any>(null);
  
  // Related questions state
  const [relatedQuestionsCount, setRelatedQuestionsCount] = useState<Record<string, number>>({});
  const [relatedQuestionsAnchor, setRelatedQuestionsAnchor] = useState<HTMLElement | null>(null);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);
  const [loadingRelatedQuestions, setLoadingRelatedQuestions] = useState(false);
  const [currentRelatedTargetId, setCurrentRelatedTargetId] = useState<string | null>(null);
  const [currentRelatedMode, setCurrentRelatedMode] = useState<'question' | 'answer' | null>(null);
  const searchRequestIdRef = useRef(0);
  
  // Kelime sayısını hesapla
  const wordCount = searchTerm.trim().split(/\s+/).filter(w => w.length > 0).length;
  const isSingleWord = wordCount === 1;

  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    
    // searchOptions'ı query parametrelerinden oku
    const urlSearchMode = (searchParams.get('searchMode') as 'phrase' | 'all_words' | 'any_word' | null) || 'all_words';
    const urlMatchTypeRaw = searchParams.get('matchType');
    // Eski 'smart' değerini handle et - artık smartSearch checkbox'ı kullanılıyor
    const urlMatchType = (urlMatchTypeRaw === 'smart' ? 'fuzzy' : (urlMatchTypeRaw as 'fuzzy' | 'exact' | null)) || 'fuzzy';
    const urlTypoTolerance = (searchParams.get('typoTolerance') as 'low' | 'medium' | 'high' | null) || 'low';
    // Akıllı arama geçici olarak kapalı — URL'den de zorla false
    const urlSmartSearch = false;
    const urlSmartLinguistic = false;
    const urlSmartSemantic = false;
    const followingParam = searchParams.get('followingOnly');
    // Girişli: URL'de false yoksa default true; çıkışlı: false
    const urlFollowingOnly = Boolean(user) && followingParam !== 'false';
    const urlCategory = searchParams.get('category') || '';
    const urlTags = searchParams.get('tags') || '';
    const urlSavedOnly = searchParams.get('savedOnly') === 'true' ? 'true' : 'false';
    const urlSortBy = searchParams.get('sortBy') || 'En Yeni';
    
    // URL'den gelen değerleri state'e aktar
    setSearchTerm(urlQuery);
    setSearchMode(urlSearchMode);
    setMatchType(urlMatchType);
    setTypoTolerance(urlTypoTolerance);
    setSmartSearch(urlSmartSearch);
    setSmartLinguistic(urlSmartLinguistic);
    setSmartSemantic(urlSmartSemantic);
    setFollowingOnly(urlFollowingOnly);

    dispatch(updateFilter({ field: 'search', value: urlQuery }));
    dispatch(updateFilter({ field: 'category', value: urlCategory }));
    dispatch(updateFilter({ field: 'tags', value: urlTags }));
    dispatch(updateFilter({ field: 'savedOnly', value: urlSavedOnly }));
    dispatch(updateFilter({ field: 'sortBy', value: urlSortBy }));
    const nextActive: string[] = [];
    if (urlCategory) nextActive.push(`category: ${urlCategory}`);
    if (urlTags) nextActive.push(`tags: ${urlTags}`);
    if (urlSavedOnly === 'true') nextActive.push(t('saved_only', currentLanguage));
    dispatch(setActiveFilters(nextActive));
    
    // URL'de query varsa ve minimum 3 karakter ise arama yap
    const trimmedUrlQuery = urlQuery.trim();
    if (trimmedUrlQuery && trimmedUrlQuery.length >= 3) {
      // URL kaynaklı arama her zaman sayfa 1'den (stale questionsPage/answersPage kullanma)
      const timestampParam = searchParams.get('_t');
      if (lastSearchTerm !== trimmedUrlQuery || timestampParam) {
        setLastSearchTerm(trimmedUrlQuery);
      }
      setQuestionsPage(1);
      setAnswersPage(1);
      setUsersPage(1);

      const finalSmartOpts = urlSmartSearch
        ? { linguistic: true, semantic: false }
        : undefined;

      performSearch(
        trimmedUrlQuery,
        urlSearchMode,
        urlMatchType,
        urlTypoTolerance,
        urlSmartSearch,
        finalSmartOpts,
        1,
        questionsItemsPerPage,
        1,
        answersItemsPerPage,
        true,
        1,
        usersItemsPerPage,
        undefined,
        urlFollowingOnly,
        urlCategory,
        urlTags,
        urlSavedOnly === 'true'
      );
    } else if (trimmedUrlQuery && trimmedUrlQuery.length > 0 && trimmedUrlQuery.length < 3) {
      setError(t('min_search_length', currentLanguage) || 'Arama için en az 3 karakter girmelisiniz.');
      setQuestions([]);
      setAnswers([]);
      setUsers([]);
      setQuestionsPagination(null);
      setAnswersPagination(null);
      setUsersPagination(null);
    } else {
      setError(null);
      setQuestions([]);
      setAnswers([]);
      setUsers([]);
      setQuestionsPagination(null);
      setAnswersPagination(null);
      setUsersPagination(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, searchParams.get('_t')]);


  const performSearch = async (
    term: string,
    mode: 'phrase' | 'all_words' | 'any_word' = 'all_words',
    match: 'fuzzy' | 'exact' = 'fuzzy',
    tolerance: 'low' | 'medium' | 'high' = 'low',
    smart: boolean = false,
    smartOpts?: { linguistic?: boolean; semantic?: boolean },
    customQuestionsPage?: number,
    customQuestionsItemsPerPage?: number,
    customAnswersPage?: number,
    customAnswersItemsPerPage?: number,
    shouldUpdateActiveTab: boolean = true, // Sayfa değişikliğinde false olmalı
    customUsersPage?: number,
    customUsersItemsPerPage?: number,
    customSortOrder?: 'asc' | 'desc',
    customFollowingOnly?: boolean,
    customCategory?: string,
    customTags?: string,
    customSavedOnly?: boolean
  ) => {
    const trimmedTerm = term.trim();
    // Minimum 3 karakter kontrolü
    if (!trimmedTerm || trimmedTerm.length < 3) {
      setQuestions([]);
      setAnswers([]);
      setUsers([]);
      setQuestionsPagination(null);
      setAnswersPagination(null);
      setUsersPagination(null);
      if (trimmedTerm.length > 0 && trimmedTerm.length < 3) {
        setError(t('min_search_length', currentLanguage) || 'Arama için en az 3 karakter girmelisiniz.');
      } else {
        setError(null);
      }
      return;
    }

    const requestId = ++searchRequestIdRef.current;
    setLoading(true);
    setError(null);

    // Canlı öncesi akıllı arama kapalı
    if (!SMART_SEARCH_ENABLED) {
      smart = false;
      smartOpts = undefined;
    }

    // Custom değerler varsa onları kullan, yoksa state'ten al
    const qPage = customQuestionsPage !== undefined ? customQuestionsPage : questionsPage;
    const qItemsPerPage = customQuestionsItemsPerPage !== undefined ? customQuestionsItemsPerPage : questionsItemsPerPage;
    const aPage = customAnswersPage !== undefined ? customAnswersPage : answersPage;
    const aItemsPerPage = customAnswersItemsPerPage !== undefined ? customAnswersItemsPerPage : answersItemsPerPage;
    const uPage = customUsersPage !== undefined ? customUsersPage : usersPage;
    const uItemsPerPage = customUsersItemsPerPage !== undefined ? customUsersItemsPerPage : usersItemsPerPage;
    const sortOrder =
      customSortOrder !== undefined ? customSortOrder : dateSortToApiOrder(dateSort);
    const applyFollowingOnly =
      Boolean(user) &&
      (customFollowingOnly !== undefined ? customFollowingOnly : followingOnly);
    const applyCategory =
      customCategory !== undefined ? customCategory : searchParams.get('category') || '';
    const applyTags = customTags !== undefined ? customTags : searchParams.get('tags') || '';
    const applySavedOnly =
      customSavedOnly !== undefined
        ? customSavedOnly
        : searchParams.get('savedOnly') === 'true';

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
        currentLanguage,
        uPage,
        uItemsPerPage,
        sortOrder,
        applyFollowingOnly,
        applyCategory || undefined,
        applyTags || undefined
      );
      if (requestId !== searchRequestIdRef.current) return;

      let nextQuestions = results.questions;
      if (applySavedOnly) {
        const savedIds = new Set(
          bookmarks
            .filter(b => b.target_type === 'question')
            .map(b => b.target_id)
        );
        nextQuestions = nextQuestions.filter(q => savedIds.has(q.id));
      }

      setQuestions(nextQuestions);
      setAnswers(results.answers);
      setUsers(results.users);
      setQuestionsPagination(results.questionsPagination);
      setAnswersPagination(results.answersPagination);
      setUsersPagination(results.usersPagination);
      
      // Aktif tab'ı ayarla (sadece yeni arama yapıldığında, sayfa değişikliğinde değil)
      if (shouldUpdateActiveTab) {
        if (nextQuestions.length > 0) {
          setActiveTab('questions');
        } else if (results.answers.length > 0) {
          setActiveTab('answers');
        } else if (results.users.length > 0) {
          setActiveTab('users');
        } else {
          setActiveTab('questions');
        }
      }
    } catch (err: any) {
      if (requestId !== searchRequestIdRef.current) return;
      console.error('Arama hatası:', err);
      setError(err.response?.data?.message || err.message || t('search_error', currentLanguage));
      setQuestions([]);
      setAnswers([]);
      setUsers([]);
      setQuestionsPagination(null);
      setAnswersPagination(null);
      setUsersPagination(null);
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  const syncFilterParams = (params: URLSearchParams, f: typeof filters) => {
    if (f.category?.trim()) params.set('category', f.category.trim());
    else params.delete('category');
    if (f.tags?.trim()) params.set('tags', f.tags.trim());
    else params.delete('tags');
    if (f.savedOnly === 'true') params.set('savedOnly', 'true');
    else params.delete('savedOnly');
    if (f.sortBy && f.sortBy !== 'En Yeni') params.set('sortBy', f.sortBy);
    else params.delete('sortBy');
  };

  const handleFilterChange = (field: string, value: string) => {
    dispatch(updateFilter({ field, value }));
  };

  const handleApplyFilters = (applied: {
    search: string;
    category: string;
    tags: string;
    sortBy: string;
    savedOnly?: string;
  }) => {
    const f = {
      ...filters,
      ...applied,
      savedOnly: applied.savedOnly ?? filters.savedOnly,
    };
    Object.entries(f).forEach(([key, value]) => {
      dispatch(updateFilter({ field: key, value: String(value ?? '') }));
    });
    const nextActive: string[] = [];
    if (f.category) nextActive.push(`category: ${f.category}`);
    if (f.tags) nextActive.push(`tags: ${f.tags}`);
    if (f.savedOnly === 'true') nextActive.push(t('saved_only', currentLanguage));
    dispatch(setActiveFilters(nextActive));

    const params = new URLSearchParams(searchParams);
    const q = (f.search || searchTerm).trim();
    if (q.length >= 3) {
      params.set('q', q);
      setSearchTerm(q);
    }
    syncFilterParams(params, f);
    params.set('_t', Date.now().toString());
    navigate(`/search?${params.toString()}`);
    dispatch(setFilterModalOpen(false));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    const params = new URLSearchParams(searchParams);
    params.delete('category');
    params.delete('tags');
    params.delete('savedOnly');
    params.delete('sortBy');
    params.set('_t', Date.now().toString());
    navigate(`/search?${params.toString()}`);
  };

  const handleRemoveFilter = (filterToRemove: string) => {
    const params = new URLSearchParams(searchParams);
    if (filterToRemove.startsWith('category:')) {
      dispatch(updateFilter({ field: 'category', value: '' }));
      params.delete('category');
    } else if (filterToRemove.startsWith('tags:')) {
      dispatch(updateFilter({ field: 'tags', value: '' }));
      params.delete('tags');
    } else if (filterToRemove === t('saved_only', currentLanguage)) {
      dispatch(updateFilter({ field: 'savedOnly', value: 'false' }));
      params.delete('savedOnly');
    }
    dispatch(setActiveFilters(activeFilters.filter(f => f !== filterToRemove)));
    params.set('_t', Date.now().toString());
    navigate(`/search?${params.toString()}`);
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
      syncFilterParams(params, filters);
      // includeAnswers artık kullanılmıyor, her zaman cevapları dahil ediyoruz
      params.delete('includeAnswers'); // Eski parametreyi temizle
      
      // searchOptions parametrelerini ayrı ayrı ekle (default: all_words / fuzzy / low)
      if (searchMode !== 'all_words') {
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
      if (matchType === 'fuzzy' && typoTolerance !== 'low') {
        params.set('typoTolerance', typoTolerance);
      } else {
        params.delete('typoTolerance');
      }
      
      // Akıllı arama geçici olarak kapalı
      params.delete('smartSearch');
      params.delete('smartLinguistic');
      params.delete('smartSemantic');

      // Takip ettiklerimde ara (girişli default true — false'u URL'de tut)
      if (user) {
        if (followingOnly) {
          params.delete('followingOnly');
        } else {
          params.set('followingOnly', 'false');
        }
      } else {
        params.delete('followingOnly');
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

  const handleFollowingOnlyChange = (checked: boolean) => {
    setFollowingOnly(checked);
    const trimmed = searchTerm.trim();
    if (trimmed.length < 3) return;

    const params = new URLSearchParams(searchParams);
    params.set('q', trimmed);
    if (checked) {
      params.delete('followingOnly');
    } else {
      params.set('followingOnly', 'false');
    }
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  const updateURL = () => {
    const params = new URLSearchParams(searchParams);
    params.set('q', searchTerm.trim());
    // includeAnswers artık kullanılmıyor, her zaman cevapları dahil ediyoruz
    params.delete('includeAnswers'); // Eski parametreyi temizle
    
    // searchOptions parametrelerini ayrı ayrı ekle (default: all_words / fuzzy / low)
    if (searchMode !== 'all_words') {
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
    if (matchType === 'fuzzy' && typoTolerance !== 'low') {
      params.set('typoTolerance', typoTolerance);
    } else {
      params.delete('typoTolerance');
    }
    
    // Akıllı arama geçici olarak kapalı
    params.delete('smartSearch');
    params.delete('smartLinguistic');
    params.delete('smartSemantic');

    if (user) {
      if (followingOnly) {
        params.delete('followingOnly');
      } else {
        params.set('followingOnly', 'false');
      }
    } else {
      params.delete('followingOnly');
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
  const runPagedSearch = (
    qPage: number,
    qLimit: number,
    aPage: number,
    aLimit: number,
    uPage: number,
    uLimit: number
  ) => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm || trimmedSearchTerm.length < 3) return;
    performSearch(
      trimmedSearchTerm,
      searchMode,
      matchType,
      typoTolerance,
      smartSearch,
      smartSearch ? { linguistic: smartLinguistic, semantic: smartSemantic } : undefined,
      qPage,
      qLimit,
      aPage,
      aLimit,
      false,
      uPage,
      uLimit,
      undefined,
      followingOnly
    );
  };

  const handleDateSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value as DateSortOrder;
    setDateSort(next);
    setQuestionsPage(1);
    setAnswersPage(1);
    setUsersPage(1);
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm || trimmedSearchTerm.length < 3) return;
    performSearch(
      trimmedSearchTerm,
      searchMode,
      matchType,
      typoTolerance,
      smartSearch,
      smartSearch ? { linguistic: smartLinguistic, semantic: smartSemantic } : undefined,
      1,
      questionsItemsPerPage,
      1,
      answersItemsPerPage,
      false,
      1,
      usersItemsPerPage,
      dateSortToApiOrder(next),
      followingOnly
    );
  };

  const handleQuestionsPageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setQuestionsPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    runPagedSearch(page, questionsItemsPerPage, answersPage, answersItemsPerPage, usersPage, usersItemsPerPage);
  };

  const handleAnswersPageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setAnswersPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    runPagedSearch(questionsPage, questionsItemsPerPage, page, answersItemsPerPage, usersPage, usersItemsPerPage);
  };

  const handleUsersPageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    setUsersPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    runPagedSearch(questionsPage, questionsItemsPerPage, answersPage, answersItemsPerPage, page, usersItemsPerPage);
  };

  const handleQuestionsItemsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value);
    setQuestionsItemsPerPage(newItemsPerPage);
    setQuestionsPage(1);
    runPagedSearch(1, newItemsPerPage, answersPage, answersItemsPerPage, usersPage, usersItemsPerPage);
  };

  const handleAnswersItemsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value);
    setAnswersItemsPerPage(newItemsPerPage);
    setAnswersPage(1);
    runPagedSearch(questionsPage, questionsItemsPerPage, 1, newItemsPerPage, usersPage, usersItemsPerPage);
  };

  const handleUsersItemsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newItemsPerPage = parseInt(event.target.value);
    setUsersItemsPerPage(newItemsPerPage);
    setUsersPage(1);
    runPagedSearch(questionsPage, questionsItemsPerPage, answersPage, answersItemsPerPage, 1, newItemsPerPage);
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
      <FilterModal
        open={filterModalOpen}
        onClose={() => dispatch(setFilterModalOpen(false))}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            {t('search', currentLanguage)}
          </Typography>

          <ActiveFilters
            filters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
          />
          
          <form onSubmit={handleSearch}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
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
              <Tooltip title={t('filter', currentLanguage)}>
                <IconButton
                  type="button"
                  aria-label={t('filter', currentLanguage)}
                  onClick={() => dispatch(setFilterModalOpen(true))}
                  sx={(theme) => ({
                    flexShrink: 0,
                    width: 56,
                    height: 56,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor:
                      filterModalOpen || activeFilters.length > 0
                        ? 'primary.main'
                        : 'divider',
                    color:
                      filterModalOpen || activeFilters.length > 0
                        ? 'primary.main'
                        : 'text.secondary',
                    backgroundColor: filterModalOpen
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'transparent',
                    '&:hover': {
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  })}
                >
                  <Badge
                    color="primary"
                    variant="dot"
                    invisible={activeFilters.length === 0}
                    overlap="circular"
                  >
                    <FilterList />
                  </Badge>
                </IconButton>
              </Tooltip>
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

                  {/* 3. Akıllı Arama / Takip filtresi - Sağ */}
                  <FormControl component="fieldset" sx={{ flex: 1 }}>
                    <FormLabel component="legend" sx={{ mb: 1 }}>
                      {t('smart_search', currentLanguage) || 'Akıllı Arama'}
                    </FormLabel>
                    <Tooltip
                      title={
                        SMART_SEARCH_ENABLED
                          ? ''
                          : t('smart_search_disabled_tooltip', currentLanguage)
                      }
                    >
                      <span>
                        <FormControlLabel
                          disabled={!SMART_SEARCH_ENABLED}
                          control={
                            <Checkbox
                              checked={SMART_SEARCH_ENABLED ? smartSearch : false}
                              onChange={(e) => handleSmartSearchChange(e.target.checked)}
                              disabled={!SMART_SEARCH_ENABLED}
                            />
                          }
                          label={t('smart_search', currentLanguage) || 'Akıllı Arama'}
                          sx={{
                            opacity: SMART_SEARCH_ENABLED ? 1 : 0.55,
                            ...(!SMART_SEARCH_ENABLED && {
                              '& .MuiFormControlLabel-label': {
                                color: 'text.disabled',
                              },
                            }),
                          }}
                        />
                      </span>
                    </Tooltip>
                    {user && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={followingOnly}
                            onChange={(e) => handleFollowingOnlyChange(e.target.checked)}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span>{t('search_following_only', currentLanguage)}</span>
                            <Tooltip title={t('search_following_only_tooltip', currentLanguage)} arrow>
                              <InfoIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
                            </Tooltip>
                          </Box>
                        }
                      />
                    )}
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
            {questions.length === 0 &&
              answers.length === 0 &&
              users.length === 0 &&
              searchTerm.trim().length >= 3 &&
              !loading &&
              !error && (
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

            {(questions.length > 0 || answers.length > 0 || users.length > 0) && (
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
                  <Tab
                    label={`${t('answers', currentLanguage)} (${answersPagination?.total || answers.length})`}
                    value="answers"
                    disabled={answers.length === 0}
                  />
                  <Tab
                    label={`${t('users', currentLanguage)} (${usersPagination?.total || users.length})`}
                    value="users"
                    disabled={users.length === 0}
                  />
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
                  dateSort={dateSort}
                  onDateSortChange={handleDateSortChange}
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
                  dateSort={dateSort}
                  onDateSortChange={handleDateSortChange}
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

            {activeTab === 'users' && users.length > 0 && (
              <>
                <ItemsPerPageSelector
                  itemsPerPage={usersItemsPerPage}
                  totalQuestions={usersPagination?.total || users.length}
                  onItemsPerPageChange={handleUsersItemsPerPageChange}
                  currentLanguage={currentLanguage}
                  dateSort={dateSort}
                  onDateSortChange={handleDateSortChange}
                />
                <List disablePadding>
                  {users.map((searchUser, index) => (
                    <Fade in timeout={400 + index * 80} key={searchUser.id}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                          borderRadius: 2,
                          mb: 1.5,
                          px: 2,
                          py: 1.5,
                          transition: 'background-color 0.2s ease, border-color 0.2s ease',
                          '&:hover': {
                            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.06),
                            borderColor: (theme) => theme.palette.primary.main,
                          },
                        }}
                        onClick={() => navigate(`/profile/${searchUser.id}`)}
                      >
                        <ListItemAvatar>
                          <ProfileAvatar
                            src={searchUser.profile_image}
                            ownerId={searchUser.id}
                            fallbackName={searchUser.name}
                            alt={searchUser.name}
                            sx={{ width: 48, height: 48 }}
                          />
                        </ListItemAvatar>
                        <ListItemText
                          primary={searchUser.name}
                          secondary={
                            <Box
                              component="span"
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 1.5,
                                mt: 0.5,
                                color: 'text.secondary',
                                fontSize: '0.875rem',
                              }}
                            >
                              <Box component="span">
                                {t('search_user_questions_count', currentLanguage).replace(
                                  '{count}',
                                  String(searchUser.questionsCount ?? 0)
                                )}
                              </Box>
                              <Box component="span">
                                {t('search_user_answers_count', currentLanguage).replace(
                                  '{count}',
                                  String(searchUser.answersCount ?? 0)
                                )}
                              </Box>
                              {searchUser.createdAt && (
                                <Box component="span">
                                  {t('search_user_joined', currentLanguage).replace(
                                    '{date}',
                                    new Date(searchUser.createdAt).toLocaleDateString()
                                  )}
                                </Box>
                              )}
                            </Box>
                          }
                          primaryTypographyProps={{ fontWeight: 600 }}
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    </Fade>
                  ))}
                </List>
                {usersPagination && usersPagination.totalPages > 1 && (
                  <PaginationContainer isPapirus={isPapirus}>
                    <Pagination
                      count={usersPagination.totalPages}
                      page={usersPage}
                      onChange={handleUsersPageChange}
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

            {activeTab === 'questions' &&
              questions.length === 0 &&
              searchTerm.trim().length >= 3 &&
              !loading &&
              !error && (
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

            {activeTab === 'users' &&
              users.length === 0 &&
              searchTerm.trim().length >= 3 &&
              !loading &&
              !error && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {t('no_results', currentLanguage)}
              </Alert>
            )}

            {activeTab === 'answers' &&
              answers.length === 0 &&
              searchTerm.trim().length >= 3 &&
              !loading &&
              !error && (
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
