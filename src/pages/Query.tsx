import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Pagination,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import QueryClauseTable from '../components/query/QueryClauseTable';
import QueryResultItem from '../components/query/QueryResultItem';
import QuerySavedBar from '../components/query/QuerySavedBar';
import {
  createEmptyRow,
  flatToTreeForEntity,
  groupSelectedRows,
  ungroupSelectedRows,
} from '../components/query/queryFlatTree';
import QuestionCard from '../components/question/QuestionCard';
import AnswerCard from '../components/answer/AnswerCard';
import ItemsPerPageSelector, {
  DateSortOrder,
  dateSortToApiOrder,
} from '../components/home/ItemsPerPageSelector';
import { queryService } from '../services/queryService';
import { bookmarkService } from '../services/bookmarkService';
import { useAppSelector } from '../store/hooks';
import { t } from '../utils/translations';
import type {
  FlatClauseRow,
  QueryFieldDef,
  QueryMatchExplanation,
  QueryPagination,
} from '../types/query';
import type { Question } from '../types/question';
import type { Answer } from '../types/answer';

type ResultTab = 'questions' | 'answers';

const emptyPagination = (limit: number): QueryPagination => ({
  page: 1,
  limit,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
});

const Query: React.FC = () => {
  const theme = useTheme();
  const { currentLanguage } = useAppSelector(state => state.language);
  const [searchParams, setSearchParams] = useSearchParams();

  const [questionFields, setQuestionFields] = useState<QueryFieldDef[]>([]);
  const [answerFields, setAnswerFields] = useState<QueryFieldDef[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [rows, setRows] = useState<FlatClauseRow[]>([createEmptyRow()]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [activeBookmarkId, setActiveBookmarkId] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questionExplanations, setQuestionExplanations] = useState<
    Record<string, QueryMatchExplanation[]>
  >({});
  const [answerExplanations, setAnswerExplanations] = useState<
    Record<string, QueryMatchExplanation[]>
  >({});
  const [questionsPagination, setQuestionsPagination] = useState<QueryPagination | null>(null);
  const [answersPagination, setAnswersPagination] = useState<QueryPagination | null>(null);
  const [questionsPage, setQuestionsPage] = useState(1);
  const [answersPage, setAnswersPage] = useState(1);
  const [questionsLimit, setQuestionsLimit] = useState(10);
  const [answersLimit, setAnswersLimit] = useState(10);
  const [dateSort, setDateSort] = useState<DateSortOrder>('newest');
  const [activeTab, setActiveTab] = useState<ResultTab>('questions');

  const loadFields = useCallback(async () => {
    setFieldsLoading(true);
    setError(null);
    try {
      const [q, a] = await Promise.all([
        queryService.getFields('question'),
        queryService.getFields('answer'),
      ]);
      setQuestionFields(q);
      setAnswerFields(a);
    } catch (e) {
      setQuestionFields([]);
      setAnswerFields([]);
      setError(e instanceof Error ? e.message : 'Failed to load fields');
    } finally {
      setFieldsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFields();
  }, [loadFields]);

  useEffect(() => {
    const bookmarkId = searchParams.get('bookmarkId');
    if (!bookmarkId) return;
    let cancelled = false;
    (async () => {
      try {
        const b = await bookmarkService.getBookmark(bookmarkId);
        if (cancelled) return;
        if (b.target_type !== 'query' || !b.payload?.rows?.length) {
          setError(t('query_no_valid_clauses', currentLanguage));
          return;
        }
        setRows(
          b.payload.rows.map(r => ({
            id: r.id,
            entity: r.entity,
            combinator: r.combinator,
            indent: r.indent,
            field: r.field,
            op: r.op as FlatClauseRow['op'],
            value: r.value,
            selected: false,
          }))
        );
        setDateSort(b.payload.dateSort);
        setActiveBookmarkId(b._id);
        setSearchParams(
          prev => {
            const next = new URLSearchParams(prev);
            next.delete('bookmarkId');
            return next;
          },
          { replace: true }
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load saved query');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, currentLanguage]);

  const runQuery = async (opts?: {
    questionsPage?: number;
    answersPage?: number;
    questionsLimit?: number;
    answersLimit?: number;
    sort?: DateSortOrder;
  }) => {
    const qRoot = flatToTreeForEntity(rows, 'question');
    const aRoot = flatToTreeForEntity(rows, 'answer');
    const hasQuestionClauses =
      qRoot.type === 'group' ? qRoot.children.length > 0 : true;
    const hasAnswerClauses =
      aRoot.type === 'group' ? aRoot.children.length > 0 : true;

    if (!hasQuestionClauses && !hasAnswerClauses) {
      setError(t('query_select_field', currentLanguage));
      return;
    }

    const qPage = opts?.questionsPage ?? questionsPage;
    const aPage = opts?.answersPage ?? answersPage;
    const qLimit = opts?.questionsLimit ?? questionsLimit;
    const aLimit = opts?.answersLimit ?? answersLimit;
    const sort = opts?.sort ?? dateSort;
    const sortOrder = dateSortToApiOrder(sort);

    setRunning(true);
    setError(null);
    try {
      const tasks: Promise<void>[] = [];

      if (hasQuestionClauses) {
        tasks.push(
          (async () => {
            const res = await queryService.execute({
              entity: 'question',
              root: qRoot,
              page: qPage,
              limit: qLimit,
              sortOrder,
            });
            setQuestions(res.data as Question[]);
            setQuestionExplanations(res.explanations);
            setQuestionsPagination(res.pagination);
            setQuestionsPage(res.pagination.page);
          })()
        );
      } else {
        setQuestions([]);
        setQuestionExplanations({});
        setQuestionsPagination(emptyPagination(qLimit));
      }

      if (hasAnswerClauses) {
        tasks.push(
          (async () => {
            const res = await queryService.execute({
              entity: 'answer',
              root: aRoot,
              page: aPage,
              limit: aLimit,
              sortOrder,
            });
            setAnswers(res.data as Answer[]);
            setAnswerExplanations(res.explanations);
            setAnswersPagination(res.pagination);
            setAnswersPage(res.pagination.page);
          })()
        );
      } else {
        setAnswers([]);
        setAnswerExplanations({});
        setAnswersPagination(emptyPagination(aLimit));
      }

      await Promise.all(tasks);
      setHasRun(true);
      if (hasQuestionClauses && !hasAnswerClauses) setActiveTab('questions');
      else if (hasAnswerClauses && !hasQuestionClauses) setActiveTab('answers');
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (e instanceof Error ? e.message : 'Query failed');
      setError(msg);
      setQuestions([]);
      setAnswers([]);
      setQuestionExplanations({});
      setAnswerExplanations({});
      setQuestionsPagination(null);
      setAnswersPagination(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: theme.palette.text.primary, mb: 0.5 }}>
          {t('query_page_title', currentLanguage)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('query_page_subtitle', currentLanguage)}
        </Typography>
      </Box>

      {fieldsLoading ? (
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1.5,
            mb: 3,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <QuerySavedBar
            rows={rows}
            dateSort={dateSort}
            currentLanguage={currentLanguage}
            activeBookmarkId={activeBookmarkId}
            onActiveBookmarkChange={setActiveBookmarkId}
            onLoad={(nextRows, nextSort) => {
              setRows(nextRows);
              setDateSort(nextSort);
              setQuestionsPage(1);
              setAnswersPage(1);
            }}
          />
          <QueryClauseTable
            rows={rows}
            questionFields={questionFields}
            answerFields={answerFields}
            onChange={setRows}
            onGroup={() => setRows(groupSelectedRows(rows))}
            onUngroup={() => setRows(ungroupSelectedRows(rows))}
            onRun={() => {
              setQuestionsPage(1);
              setAnswersPage(1);
              void runQuery({ questionsPage: 1, answersPage: 1 });
            }}
            running={running}
            currentLanguage={currentLanguage}
          />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {running && (
        <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      )}

      {hasRun && !running && (
        <>
          <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v as ResultTab)}>
              <Tab
                value="questions"
                label={`${t('questions', currentLanguage)} (${questionsPagination?.total ?? 0})`}
              />
              <Tab
                value="answers"
                label={`${t('answers', currentLanguage)} (${answersPagination?.total ?? 0})`}
              />
            </Tabs>
          </Box>

          {activeTab === 'questions' && (
            <>
              <ItemsPerPageSelector
                itemsPerPage={questionsLimit}
                totalQuestions={questionsPagination?.total || 0}
                onItemsPerPageChange={e => {
                  const n = parseInt(e.target.value, 10);
                  setQuestionsLimit(n);
                  setQuestionsPage(1);
                  void runQuery({ questionsPage: 1, questionsLimit: n });
                }}
                currentLanguage={currentLanguage}
                dateSort={dateSort}
                onDateSortChange={e => {
                  const s = e.target.value as DateSortOrder;
                  setDateSort(s);
                  setQuestionsPage(1);
                  setAnswersPage(1);
                  void runQuery({
                    questionsPage: 1,
                    answersPage: 1,
                    sort: s,
                  });
                }}
              />
              {questions.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  {t('query_no_results', currentLanguage)}
                </Typography>
              ) : (
                questions.map((q, index) => {
                  const id = q.id || (q as { _id?: string })._id || '';
                  return (
                    <QueryResultItem
                      key={id}
                      matches={questionExplanations[id] || []}
                      currentLanguage={currentLanguage}
                    >
                      <QuestionCard question={q} isAlternateTexture={index % 2 === 1} />
                    </QueryResultItem>
                  );
                })
              )}
              {questionsPagination && questionsPagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    page={questionsPage}
                    count={questionsPagination.totalPages}
                    onChange={(_e, p) => {
                      setQuestionsPage(p);
                      void runQuery({ questionsPage: p });
                    }}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}

          {activeTab === 'answers' && (
            <>
              <ItemsPerPageSelector
                itemsPerPage={answersLimit}
                totalQuestions={answersPagination?.total || 0}
                onItemsPerPageChange={e => {
                  const n = parseInt(e.target.value, 10);
                  setAnswersLimit(n);
                  setAnswersPage(1);
                  void runQuery({ answersPage: 1, answersLimit: n });
                }}
                currentLanguage={currentLanguage}
                dateSort={dateSort}
                onDateSortChange={e => {
                  const s = e.target.value as DateSortOrder;
                  setDateSort(s);
                  setQuestionsPage(1);
                  setAnswersPage(1);
                  void runQuery({
                    questionsPage: 1,
                    answersPage: 1,
                    sort: s,
                  });
                }}
              />
              {answers.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  {t('query_no_results', currentLanguage)}
                </Typography>
              ) : (
                answers.map((a, index) => {
                  const id = a.id || (a as { _id?: string })._id || '';
                  return (
                    <QueryResultItem
                      key={id}
                      matches={answerExplanations[id] || []}
                      currentLanguage={currentLanguage}
                    >
                      <AnswerCard
                        answer={a}
                        isAlternateTexture={index % 2 === 1}
                        showParentInfo
                      />
                    </QueryResultItem>
                  );
                })
              )}
              {answersPagination && answersPagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    page={answersPage}
                    count={answersPagination.totalPages}
                    onChange={(_e, p) => {
                      setAnswersPage(p);
                      void runQuery({ answersPage: p });
                    }}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Layout>
  );
};

export default Query;
