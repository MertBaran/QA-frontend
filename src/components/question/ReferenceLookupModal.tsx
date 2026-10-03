import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Typography,
  CircularProgress,
  Stack,
  Button,
} from '@mui/material';
import { Search, Close, Clear } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { t } from '../../utils/translations';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import { questionService } from '../../services/questionService';
import { searchService } from '../../services/searchService';
import ReferenceSelectedCard from './ReferenceSelectedCard';
import type { Question } from '../../types/question';
import type { Answer } from '../../types/answer';

const FORMAT_OPTIONS = ['format_ne', 'format_niye', 'format_nasil', 'format_hangisi', 'format_evet_hayir', 'format_kim', 'format_nicelik', 'format_yer', 'format_zaman', 'format_teyit', 'format_belirsiz'] as const;
const INTEREST_OPTIONS = ['interest_gundelik', 'interest_akademik', 'interest_ahiretlik', 'interest_belirsiz'] as const;

type TextOp = 'contains' | 'equals' | 'starts_with' | 'ends_with';
type DateOp = 'equals' | 'greater_than' | 'less_than' | 'between';

const TEXT_OPS: { value: TextOp; key: string }[] = [
  { value: 'contains', key: 'op_contains' },
  { value: 'equals', key: 'op_equals' },
  { value: 'starts_with', key: 'op_starts_with' },
  { value: 'ends_with', key: 'op_ends_with' },
];

const DATE_OPS: { value: DateOp; key: string }[] = [
  { value: 'equals', key: 'op_equals' },
  { value: 'greater_than', key: 'op_greater_than' },
  { value: 'less_than', key: 'op_less_than' },
  { value: 'between', key: 'op_between' },
];

function matchText(value: string, op: TextOp, search: string): boolean {
  const v = (value || '').toLowerCase();
  const s = search.trim().toLowerCase();
  if (!s) return true;
  if (op === 'contains') return v.includes(s);
  if (op === 'equals') return v === s;
  if (op === 'starts_with') return v.startsWith(s);
  if (op === 'ends_with') return v.endsWith(s);
  return true;
}

function matchDate(ts: number, op: DateOp, val1: string, val2: string): boolean {
  if (!val1 && op !== 'between') return true;
  if (op === 'between' && (!val1 || !val2)) return true;
  const d1 = val1 ? new Date(val1 + 'T00:00:00').getTime() : 0;
  const d2 = val2 ? new Date(val2 + 'T23:59:59').getTime() : 0;
  if (op === 'equals') return ts >= d1 && ts <= new Date(val1 + 'T23:59:59').getTime();
  if (op === 'greater_than') return ts > d1;
  if (op === 'less_than') return ts < d1;
  if (op === 'between') return ts >= d1 && ts <= d2;
  return true;
}

interface ReferenceLookupModalProps {
  open: boolean;
  onClose: () => void;
  type: 'soru' | 'cevap';
  onSelect: (id: string, item: Question | Answer) => void;
  currentLanguage: string;
}

const dateInputSx = (theme: { palette: { background: { paper: string }; text: { primary: string }; mode?: string } }) => ({
  width: 160,
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,
    '& .MuiInputBase-input': { color: theme.palette.text.primary },
    '& input::-webkit-calendar-picker-indicator': {
      filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
    },
  },
});

const ReferenceLookupModal: React.FC<ReferenceLookupModalProps> = ({
  open,
  onClose,
  type,
  onSelect,
  currentLanguage,
}) => {
  const theme = useTheme();
  const [searchUsername, setSearchUsername] = useState('');
  const [opUsername, setOpUsername] = useState<TextOp>('contains');
  const [searchTitle, setSearchTitle] = useState('');
  const [opTitle, setOpTitle] = useState<TextOp>('contains');
  const [searchDetail, setSearchDetail] = useState('');
  const [opDetail, setOpDetail] = useState<TextOp>('contains');
  const [createdAtOp, setCreatedAtOp] = useState<DateOp>('equals');
  const [createdAtVal, setCreatedAtVal] = useState('');
  const [createdAtVal2, setCreatedAtVal2] = useState('');
  const [category, setCategory] = useState('');
  const [format, setFormat] = useState('');
  const [interest, setInterest] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const applyClientFilters = useCallback(
    (items: Question[] | Answer[]) => {
      let filtered = [...items];
      if (type === 'soru') {
        filtered = (filtered as Question[]).filter((x) => {
          if (!matchText(x.author?.name || '', opUsername, searchUsername)) return false;
          if (!matchText(x.summary || '', opTitle, searchTitle)) return false;
          if (!matchText(x.detail || '', opDetail, searchDetail)) return false;
          if (!matchDate(new Date(x.createdAt).getTime(), createdAtOp, createdAtVal, createdAtVal2)) return false;
          if (category.trim() && !(x.category || '').toLowerCase().includes(category.trim().toLowerCase())) return false;
          return true;
        });
      } else {
        filtered = (filtered as Answer[]).filter((x) => {
          if (!matchText(x.author?.name || '', opUsername, searchUsername)) return false;
          if (!matchText(x.questionSummary || '', opTitle, searchTitle)) return false;
          if (!matchText(x.content || '', opDetail, searchDetail)) return false;
          if (!matchDate(new Date(x.createdAt).getTime(), createdAtOp, createdAtVal, createdAtVal2)) return false;
          return true;
        });
      }
      return filtered;
    },
    [searchUsername, opUsername, searchTitle, opTitle, searchDetail, opDetail, createdAtOp, createdAtVal, createdAtVal2, category, type]
  );

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const combined = [searchTitle, searchDetail, searchUsername].filter((s) => s.trim().length >= 2).join(' ').trim();
      if (combined.length >= 3) {
        const { questions: q } = await searchService.searchQuestions(combined, 1, 80);
        let filtered = q;
        if (category) filtered = filtered.filter((x) => x.category === category);
        if (format) filtered = filtered.filter((x) => x.format === format);
        if (interest) filtered = filtered.filter((x) => x.interest === interest);
        filtered = applyClientFilters(filtered) as Question[];
        setQuestions(filtered);
      } else {
        const result = await questionService.getQuestionsPaginatedWithParents({
          page: 1,
          limit: 80,
          search: combined || undefined,
          category: category || undefined,
        });
        let filtered = result.data;
        if (format) filtered = filtered.filter((x) => x.format === format);
        if (interest) filtered = filtered.filter((x) => x.interest === interest);
        filtered = applyClientFilters(filtered) as Question[];
        setQuestions(filtered);
      }
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [searchUsername, searchTitle, searchDetail, category, format, interest, applyClientFilters]);

  const loadAnswers = useCallback(async () => {
    setLoading(true);
    try {
      const combined = [searchTitle, searchDetail, searchUsername].filter((s) => s.trim().length >= 2).join(' ').trim();
      if (combined.length >= 3) {
        const { answers: a } = await searchService.searchAnswers(combined, 1, 80);
        const filtered = applyClientFilters(a) as Answer[];
        setAnswers(filtered);
      } else {
        setAnswers([]);
      }
    } catch {
      setAnswers([]);
    } finally {
      setLoading(false);
    }
  }, [searchUsername, searchTitle, searchDetail, applyClientFilters]);

  const hasAnyFilter = Boolean(
    searchUsername.trim() || searchTitle.trim() || searchDetail.trim() ||
    createdAtVal || createdAtVal2 || category || format || interest
  );

  const handleSearch = useCallback(() => {
    if (!hasAnyFilter) return;
    setHasSearched(true);
    if (type === 'soru') loadQuestions();
    else loadAnswers();
  }, [type, hasAnyFilter, loadQuestions, loadAnswers]);

  const resetAll = useCallback(() => {
    setSearchUsername('');
    setOpUsername('contains');
    setSearchTitle('');
    setOpTitle('contains');
    setSearchDetail('');
    setOpDetail('contains');
    setCreatedAtOp('equals');
    setCreatedAtVal('');
    setCreatedAtVal2('');
    setCategory('');
    setFormat('');
    setInterest('');
    setQuestions([]);
    setAnswers([]);
    setHasSearched(false);
  }, []);

  const handleSelectQuestion = (q: Question) => {
    onSelect(q.id, q);
    onClose();
  };

  const handleSelectAnswer = (a: Answer) => {
    onSelect(a.id, a);
    onClose();
  };

  const selectSx = { '& .MuiSelect-select': { color: (theme: { palette: { text: { primary: string } } }) => theme.palette.text.primary } };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, minHeight: 720, maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6">
          {type === 'soru' ? t('reference_type_question', currentLanguage) : t('reference_type_answer', currentLanguage)} {t('reference_lookup', currentLanguage)}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ width: { md: 400 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                {t('filters', currentLanguage)}
              </Typography>
              <Button size="small" startIcon={<Clear />} onClick={resetAll} color="inherit" sx={{ minWidth: 'auto', px: 1 }}>
                {t('filter_reset_all', currentLanguage)}
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField size="small" placeholder={t('search_by_username', currentLanguage)} value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)} sx={{ flex: 1, '& .MuiInputBase-input': { color: 'inherit' } }} />
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select value={opUsername} onChange={(e) => setOpUsername(e.target.value as TextOp)} sx={selectSx}>
                  {TEXT_OPS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{t(o.key, currentLanguage)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton size="small" onClick={() => { setSearchUsername(''); setOpUsername('contains'); }} title={t('filter_reset_single', currentLanguage)} sx={{ flexShrink: 0 }}>
                <Clear fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField size="small" placeholder={t('search_by_title', currentLanguage)} value={searchTitle} onChange={(e) => setSearchTitle(e.target.value)} sx={{ flex: 1, '& .MuiInputBase-input': { color: 'inherit' } }} />
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select value={opTitle} onChange={(e) => setOpTitle(e.target.value as TextOp)} sx={selectSx}>
                  {TEXT_OPS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{t(o.key, currentLanguage)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton size="small" onClick={() => { setSearchTitle(''); setOpTitle('contains'); }} title={t('filter_reset_single', currentLanguage)} sx={{ flexShrink: 0 }}>
                <Clear fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField size="small" placeholder={t('search_by_detail', currentLanguage)} value={searchDetail} onChange={(e) => setSearchDetail(e.target.value)} multiline maxRows={2} sx={{ flex: 1, '& .MuiInputBase-input': { color: 'inherit' } }} />
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <Select value={opDetail} onChange={(e) => setOpDetail(e.target.value as TextOp)} sx={selectSx}>
                  {TEXT_OPS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{t(o.key, currentLanguage)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton size="small" onClick={() => { setSearchDetail(''); setOpDetail('contains'); }} title={t('filter_reset_single', currentLanguage)} sx={{ flexShrink: 0 }}>
                <Clear fontSize="small" />
              </IconButton>
            </Box>
            {type === 'soru' && (
              <>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField size="small" placeholder={t('category', currentLanguage)} value={category} onChange={(e) => setCategory(e.target.value)} sx={{ flex: 1, '& .MuiInputBase-input': { color: 'inherit' } }} />
                  <IconButton size="small" onClick={() => setCategory('')} title={t('filter_reset_single', currentLanguage)} sx={{ flexShrink: 0 }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>{t('format', currentLanguage)}</InputLabel>
                    <Select value={format} label={t('format', currentLanguage)} onChange={(e) => setFormat(e.target.value)} sx={selectSx}>
                      <MenuItem value="">—</MenuItem>
                      {FORMAT_OPTIONS.map((opt) => (
                        <MenuItem key={opt} value={opt}>{t(opt, currentLanguage)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <IconButton size="small" onClick={() => setFormat('')} title={t('filter_reset_single', currentLanguage)} sx={{ flexShrink: 0 }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>{t('interest', currentLanguage)}</InputLabel>
                    <Select value={interest} label={t('interest', currentLanguage)} onChange={(e) => setInterest(e.target.value)} sx={selectSx}>
                      <MenuItem value="">—</MenuItem>
                      {INTEREST_OPTIONS.map((opt) => (
                        <MenuItem key={opt} value={opt}>{t(opt, currentLanguage)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <IconButton size="small" onClick={() => setInterest('')} title={t('filter_reset_single', currentLanguage)} sx={{ flexShrink: 0 }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Box>
              </>
            )}
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>{t('search_by_created_at', currentLanguage)}</Typography>
              {createdAtOp === 'between' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <FormControl size="small" sx={{ minWidth: 110 }}>
                      <Select value={createdAtOp} onChange={(e) => setCreatedAtOp(e.target.value as DateOp)} sx={selectSx}>
                        {DATE_OPS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{t(o.key, currentLanguage)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <IconButton size="small" onClick={() => { setCreatedAtOp('equals'); setCreatedAtVal(''); setCreatedAtVal2(''); }} title={t('filter_reset_single', currentLanguage)} sx={{ flexShrink: 0 }}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, ml: 1 }}>{t('search_date_from', currentLanguage)}</Typography>
                      <TextField size="small" type="date" value={createdAtVal} onChange={(e) => setCreatedAtVal(e.target.value)} InputLabelProps={{ shrink: true }} sx={dateInputSx(theme)} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25, ml: 1 }}>{t('search_date_to', currentLanguage)}</Typography>
                      <TextField size="small" type="date" value={createdAtVal2} onChange={(e) => setCreatedAtVal2(e.target.value)} InputLabelProps={{ shrink: true }} sx={dateInputSx(theme)} />
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField size="small" type="date" value={createdAtVal} onChange={(e) => setCreatedAtVal(e.target.value)} InputLabelProps={{ shrink: true }} sx={dateInputSx(theme)} />
                  <FormControl size="small" sx={{ minWidth: 110 }}>
                    <Select value={createdAtOp} onChange={(e) => setCreatedAtOp(e.target.value as DateOp)} sx={selectSx}>
                      {DATE_OPS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{t(o.key, currentLanguage)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <IconButton size="small" onClick={() => { setCreatedAtVal(''); setCreatedAtVal2(''); }} title={t('filter_reset_single', currentLanguage)} sx={{ flexShrink: 0 }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
            <Button variant="contained" size="small" startIcon={<Search />} onClick={handleSearch} disabled={!hasAnyFilter} sx={{ mt: 1 }}>
              {t('reference_search_button', currentLanguage)}
            </Button>
          </Box>
          <Box sx={(theme) => ({ flex: 1, minWidth: 0, minHeight: 600, maxHeight: 900, overflow: 'auto', width: '100%', ...getScrollbarSx(theme) })}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : type === 'soru' ? (
              <Stack spacing={1} sx={{ width: '100%' }}>
                {questions.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                    {!hasSearched ? t('reference_set_filters_hint', currentLanguage) : t('reference_no_results', currentLanguage)}
                  </Typography>
                ) : (
                  questions.map((q) => (
                    <ReferenceSelectedCard
                      key={q.id}
                      question={q}
                      currentLanguage={currentLanguage}
                      onSelect={() => handleSelectQuestion(q)}
                    />
                  ))
                )}
              </Stack>
            ) : (
              <Stack spacing={1} sx={{ width: '100%' }}>
                {answers.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                    {!hasSearched
                      ? t('reference_set_filters_hint', currentLanguage)
                      : t('reference_no_results', currentLanguage)}
                  </Typography>
                ) : (
                  answers.map((a) => (
                    <ReferenceSelectedCard
                      key={a.id}
                      answer={a}
                      currentLanguage={currentLanguage}
                      onSelect={() => handleSelectAnswer(a)}
                    />
                  ))
                )}
              </Stack>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ReferenceLookupModal;
