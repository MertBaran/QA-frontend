import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import { FolderOpen } from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import { t } from '../../utils/translations';
import { stripRefLinksForDisplay } from '../../utils/refLinkDisplay';
import { bookmarkService } from '../../services/bookmarkService';
import UserAvatarById from '../../components/ui/UserAvatarById';
import type { BookmarkResponse } from '../../types/bookmark';
import type { BookmarkCollection } from '../../services/bookmarkService';

const PREVIEW_LENGTH = 250;

type BookmarkItem = BookmarkResponse & { addedAt?: string };

const formatDate = (dateStr: string, lang: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const BookmarkSharedView = () => {
  const { collectionId, token } = useParams<{ collectionId?: string; token?: string }>();
  const navigate = useNavigate();
  const { currentLanguage } = useAppSelector((s) => s.language);
  const [data, setData] = useState<{
    collection: BookmarkCollection;
    items: BookmarkItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      bookmarkService
        .getPublicCollectionByToken(token)
        .then((result) => {
          if (result) {
            setData({ collection: result.collection, items: result.items as BookmarkItem[] });
          } else {
            setError(t('bookmark_not_found_or_private', currentLanguage));
          }
        })
        .catch(() => setError(t('bookmark_not_found_or_private', currentLanguage)))
        .finally(() => setLoading(false));
    } else if (collectionId) {
      bookmarkService
        .getPublicCollection(collectionId)
        .then((result) => {
          if (result) {
            setData({ collection: result.collection, items: result.items as BookmarkItem[] });
          } else {
            setError(t('bookmark_not_found_or_private', currentLanguage));
          }
        })
        .catch(() => setError(t('bookmark_not_found_or_private', currentLanguage)))
        .finally(() => setLoading(false));
    } else {
      setError(t('bookmark_not_found_or_private', currentLanguage));
      setLoading(false);
    }
  }, [collectionId, token, currentLanguage]);

  const handleItemClick = (b: BookmarkResponse) => {
    if (b.target_type === 'query') {
      navigate(`/query?bookmarkId=${b._id}`);
      return;
    }
    if (b.target_type === 'question') {
      navigate(`/questions/${b.target_id}`);
    } else {
      const url = (b.target_data as any)?.url ?? '';
      const qId = url.match(/\/questions\/([^/#]+)/)?.[1];
      navigate(qId ? `/questions/${qId}#answer-${b.target_id}` : '/questions');
    }
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <FolderOpen sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {error ?? t('bookmark_not_found_or_private', currentLanguage)}
          </Typography>
        </Box>
      </Layout>
    );
  }

  const { collection, items } = data;

  return (
    <Layout fullWidth>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
          width: '100%',
        }}
      >
        <Box sx={{ px: 3, py: 3, borderBottom: (th) => `1px solid ${th.palette.divider}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <FolderOpen color="primary" />
            <Typography variant="h5" fontWeight={600}>
              {collection.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({t('bookmark_shared_title', currentLanguage)})
            </Typography>
          </Box>
          {collection.description && (
            <Typography variant="body2" color="text.secondary">
              {collection.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {items.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {t('bookmark_empty_folder', currentLanguage)}
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 200 }}>{t('bookmark_owner', currentLanguage)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 100 }}>{t('bookmark_type', currentLanguage)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 220 }}>{t('bookmark_question_summary', currentLanguage)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 220 }}>{t('bookmark_detail', currentLanguage)}</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120 }}>{t('bookmark_added_at', currentLanguage)}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((b) => {
                    const questionSummary = (b.target_data?.title ?? '').slice(0, PREVIEW_LENGTH) + ((b.target_data?.title ?? '').length > PREVIEW_LENGTH ? '...' : '');
                    const contentDisplay = stripRefLinksForDisplay(b.target_data?.content ?? '');
                    const detail = contentDisplay.slice(0, PREVIEW_LENGTH) + (contentDisplay.length > PREVIEW_LENGTH ? '...' : '');
                    const typeLabel =
                      b.target_type === 'question'
                        ? t('bookmark_type_question', currentLanguage)
                        : b.target_type === 'query'
                          ? t('bookmark_type_query', currentLanguage)
                          : t('bookmark_type_answer', currentLanguage);
                    const authorName = b.target_data?.author ?? '—';
                    const authorId = b.target_data?.authorId ?? undefined;
                    const addedAt = (b as BookmarkItem).addedAt || b.createdAt;

                    return (
                      <TableRow
                        key={b._id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleItemClick(b)}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <UserAvatarById userId={authorId} fallbackName={authorName} sx={{ width: 36, height: 36 }} />
                            <Typography variant="body2">{authorName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{typeLabel}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{questionSummary}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{detail}</Typography>
                        </TableCell>
                        <TableCell>{formatDate(addedAt, currentLanguage)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default BookmarkSharedView;
