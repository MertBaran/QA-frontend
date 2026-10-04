import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import { ManageSearch } from '@mui/icons-material';
import { t } from '../../utils/translations';
import { searchService } from '../../services/searchService';
import { questionService } from '../../services/questionService';
import { answerService } from '../../services/answerService';
import { commentService } from '../../services/commentService';
import ReferenceSelectedCard from './ReferenceSelectedCard';
import ReferenceLookupModal from './ReferenceLookupModal';
import type { Question } from '../../types/question';
import type { Answer } from '../../types/answer';
import type { CommentItem } from '../../types/comment';

export interface AttachedFileOption {
  id: string;
  file: File;
  description: string;
}

interface ReferenceContentSelectorProps {
  type: 'link' | 'soru' | 'cevap' | 'yorum' | 'dosya';
  value: string;
  onChange: (value: string) => void;
  attachedFiles: AttachedFileOption[];
  currentLanguage: string;
  placeholder?: string;
  readOnly?: boolean;
}

const MIN_SEARCH_LENGTH = 3;

const ReferenceContentSelector: React.FC<ReferenceContentSelectorProps> = ({
  type,
  value,
  onChange,
  attachedFiles,
  currentLanguage,
  placeholder,
  readOnly = false,
}) => {
  const [questionSearch, setQuestionSearch] = useState('');
  const [answerSearch, setAnswerSearch] = useState('');
  const [commentSearch, setCommentSearch] = useState('');
  const [questionOptions, setQuestionOptions] = useState<Question[]>([]);
  const [answerOptions, setAnswerOptions] = useState<Answer[]>([]);
  const [commentOptions, setCommentOptions] = useState<CommentItem[]>([]);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);

  const searchQuestions = useCallback(async (term: string) => {
    if (term.length < MIN_SEARCH_LENGTH) {
      setQuestionOptions([]);
      return;
    }
    setQuestionLoading(true);
    try {
      const { questions } = await searchService.searchQuestions(term, 1, 15);
      setQuestionOptions(questions);
    } catch {
      setQuestionOptions([]);
    } finally {
      setQuestionLoading(false);
    }
  }, []);

  const searchAnswers = useCallback(async (term: string) => {
    if (term.length < MIN_SEARCH_LENGTH) {
      setAnswerOptions([]);
      return;
    }
    setAnswerLoading(true);
    try {
      const { answers } = await searchService.searchAnswers(term, 1, 15);
      setAnswerOptions(answers);
    } catch {
      setAnswerOptions([]);
    } finally {
      setAnswerLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchQuestions(questionSearch), 300);
    return () => clearTimeout(t);
  }, [questionSearch, searchQuestions]);

  useEffect(() => {
    const t = setTimeout(() => searchAnswers(answerSearch), 300);
    return () => clearTimeout(t);
  }, [answerSearch, searchAnswers]);

  const searchComments = useCallback(async (term: string) => {
    if (term.length < MIN_SEARCH_LENGTH) {
      setCommentOptions([]);
      return;
    }
    setCommentLoading(true);
    try {
      setCommentOptions(await commentService.search(term, 15));
    } catch {
      setCommentOptions([]);
    } finally {
      setCommentLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchComments(commentSearch), 300);
    return () => clearTimeout(timer);
  }, [commentSearch, searchComments]);

  useEffect(() => {
    if (type === 'soru' && !value) setSelectedQuestion(null);
    else if (type === 'soru' && value && !questionOptions.find((q) => q.id === value)) {
      questionService.getQuestionById(value).then((q) => q && setSelectedQuestion(q));
    }
  }, [type, value, questionOptions]);

  useEffect(() => {
    if (type === 'cevap' && !value) setSelectedAnswer(null);
    else if (type === 'cevap' && value && !answerOptions.find((a) => a.id === value)) {
      answerService.getAnswerById(value).then((a) => a && setSelectedAnswer(a));
    }
  }, [type, value, answerOptions]);

  useEffect(() => {
    if (type === 'yorum' && !value) setSelectedComment(null);
    else if (type === 'yorum' && value && !commentOptions.find(comment => comment.id === value)) {
      commentService.getById(value).then(comment => comment && setSelectedComment(comment));
    }
  }, [type, value, commentOptions]);

  if (type === 'link') {
    return (
      <TextField
        label={t('reference_content', currentLanguage)}
        value={value}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        multiline
        minRows={2}
        size="small"
        placeholder={placeholder}
        InputProps={{ readOnly: readOnly }}
        sx={{ flex: 1, minWidth: 0, '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary } }}
      />
    );
  }

  if (type === 'dosya') {
    return (
      <FormControl size="small" sx={{ flex: 1, minWidth: 0 }} disabled={readOnly}>
        <InputLabel>{t('reference_content', currentLanguage)}</InputLabel>
        <Select
          value={value || ''}
          label={t('reference_content', currentLanguage)}
          onChange={(e) => !readOnly && onChange(e.target.value)}
          sx={{ '& .MuiSelect-select': { color: (theme) => theme.palette.text.primary } }}
        >
          <MenuItem value="">
            <em>{attachedFiles.length === 0 ? t('reference_no_files', currentLanguage) : t('reference_select_file', currentLanguage)}</em>
          </MenuItem>
          {attachedFiles.map((f, idx) => (
            <MenuItem key={f.id} value={f.id}>
              {`${idx + 1} - ${f.file.name}${f.description?.trim() ? ` - ${f.description}` : ''}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  if (type === 'soru') {
    const acSelected = questionOptions.find((q) => q.id === value) || selectedQuestion;
    const optionsWithSelected = value && !acSelected
      ? [{ id: value, summary: value } as Question, ...questionOptions]
      : questionOptions;
    return (
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Autocomplete
            size="small"
            sx={{ flex: 1, minWidth: 0 }}
            options={optionsWithSelected}
            value={acSelected ?? (value ? { id: value, summary: value } as Question : null)}
            inputValue={questionSearch}
            onInputChange={(_, v) => !readOnly && setQuestionSearch(v)}
            onChange={(_, q) => {
              if (readOnly) return;
              setSelectedQuestion(q ?? null);
              onChange(q?.id ?? '');
            }}
            disabled={readOnly}
            getOptionLabel={(q) => (typeof q === 'object' && q?.summary) ? q.summary : String(q?.id ?? '')}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            loading={questionLoading}
            ListboxProps={{ sx: (theme: any) => ({ maxHeight: 280, ...getScrollbarSx(theme) }) }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('reference_content', currentLanguage)}
                placeholder={t('reference_search_question', currentLanguage)}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {questionLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{ '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary } }}
              />
            )}
            renderOption={(props, q) => (
              <li {...props} key={q.id}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {q.summary}
                  </Typography>
                  {q.category && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {q.category}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
          />
          {!readOnly && (
          <Tooltip title={t('reference_lookup', currentLanguage)}>
            <IconButton size="small" onClick={() => setLookupOpen(true)} sx={{ mt: 0.5 }}>
              <ManageSearch fontSize="small" />
            </IconButton>
          </Tooltip>
          )}
        </Box>
        {value && (selectedQuestion || acSelected) && (
          <ReferenceSelectedCard
            question={selectedQuestion || acSelected || undefined}
            currentLanguage={currentLanguage}
          />
        )}
        <ReferenceLookupModal
          open={lookupOpen}
          onClose={() => setLookupOpen(false)}
          type="soru"
          onSelect={(id, item) => {
            setSelectedQuestion(item as Question);
            onChange(id);
          }}
          currentLanguage={currentLanguage}
        />
      </Box>
    );
  }

  if (type === 'cevap') {
    const acSelected = answerOptions.find((a) => a.id === value) || selectedAnswer;
    const optionsWithSelected = value && !acSelected
      ? [{ id: value, content: value } as Answer, ...answerOptions]
      : answerOptions;
    return (
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Autocomplete
            size="small"
            sx={{ flex: 1, minWidth: 0 }}
            options={optionsWithSelected}
            value={acSelected ?? (value ? { id: value, content: value } as Answer : null)}
            inputValue={answerSearch}
            onInputChange={(_, v) => !readOnly && setAnswerSearch(v)}
            onChange={(_, a) => {
              if (readOnly) return;
              setSelectedAnswer(a ?? null);
              onChange(a?.id ?? '');
            }}
            disabled={readOnly}
            getOptionLabel={(a) => (typeof a === 'object' && a?.content) ? a.content.slice(0, 80) + (a.content.length > 80 ? '...' : '') : String(a?.id ?? '')}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            loading={answerLoading}
            ListboxProps={{ sx: (theme: any) => ({ maxHeight: 280, ...getScrollbarSx(theme) }) }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('reference_content', currentLanguage)}
                placeholder={t('reference_search_answer', currentLanguage)}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {answerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{ '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary } }}
              />
            )}
            renderOption={(props, a) => (
              <li {...props} key={a.id}>
                <Box>
                  <Typography variant="body2">
                    {a.content?.slice(0, 100)}
                    {a.content && a.content.length > 100 ? '...' : ''}
                  </Typography>
                  {a.questionSummary && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {a.questionSummary}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
          />
          {!readOnly && (
          <Tooltip title={t('reference_lookup', currentLanguage)}>
            <IconButton size="small" onClick={() => setLookupOpen(true)} sx={{ mt: 0.5 }}>
              <ManageSearch fontSize="small" />
            </IconButton>
          </Tooltip>
          )}
        </Box>
        {value && (selectedAnswer || acSelected) && (
          <ReferenceSelectedCard
            answer={selectedAnswer || acSelected || undefined}
            currentLanguage={currentLanguage}
          />
        )}
        <ReferenceLookupModal
          open={lookupOpen}
          onClose={() => setLookupOpen(false)}
          type="cevap"
          onSelect={(id, item) => {
            setSelectedAnswer(item as Answer);
            onChange(id);
          }}
          currentLanguage={currentLanguage}
        />
      </Box>
    );
  }

  if (type === 'yorum') {
    const acSelected = commentOptions.find(comment => comment.id === value) || selectedComment;
    const labelOf = (comment: CommentItem) => {
      const text = comment.body || '';
      return text.length > 80 ? `${text.slice(0, 80)}...` : text || comment.id;
    };
    const optionsWithSelected = value && !acSelected
      ? [{ id: value, body: value } as CommentItem, ...commentOptions]
      : commentOptions;
    return (
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Autocomplete
            size="small"
            sx={{ flex: 1, minWidth: 0 }}
            options={optionsWithSelected}
            value={acSelected ?? (value ? { id: value, body: value } as CommentItem : null)}
            inputValue={commentSearch}
            onInputChange={(_, next) => !readOnly && setCommentSearch(next)}
            onChange={(_, comment) => {
              if (readOnly) return;
              setSelectedComment(comment ?? null);
              onChange(comment?.id ?? '');
            }}
            disabled={readOnly}
            getOptionLabel={comment => (typeof comment === 'object' ? labelOf(comment) : '')}
            isOptionEqualToValue={(option, selected) => option.id === selected?.id}
            loading={commentLoading}
            ListboxProps={{ sx: (theme: any) => ({ maxHeight: 280, ...getScrollbarSx(theme) }) }}
            renderInput={params => (
              <TextField
                {...params}
                label={t('reference_content', currentLanguage)}
                placeholder={t('reference_search_comment', currentLanguage)}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {commentLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{ '& .MuiInputBase-input': { color: theme => theme.palette.text.primary } }}
              />
            )}
            renderOption={(props, comment) => (
              <li {...props} key={comment.id}>
                <Box>
                  <Typography variant="body2">{labelOf(comment)}</Typography>
                  {comment.authorName && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {comment.authorName}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
          />
          {!readOnly && (
            <Tooltip title={t('reference_lookup', currentLanguage)}>
              <IconButton size="small" onClick={() => setLookupOpen(true)} sx={{ mt: 0.5 }}>
                <ManageSearch fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {value && (selectedComment || acSelected) && (
          <ReferenceSelectedCard
            comment={selectedComment || acSelected || undefined}
            currentLanguage={currentLanguage}
          />
        )}
        <ReferenceLookupModal
          open={lookupOpen}
          onClose={() => setLookupOpen(false)}
          type="yorum"
          onSelect={(id, item) => {
            setSelectedComment(item as CommentItem);
            onChange(id);
          }}
          currentLanguage={currentLanguage}
        />
      </Box>
    );
  }

  return null;
};

export default ReferenceContentSelector;
