import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Layout from '../components/layout/Layout';
import InquireSearchPanel from '../components/inquire/InquireSearchPanel';
import InquireGraphCanvas from '../components/inquire/InquireGraphCanvas';
import QuestionDetail from './question/QuestionDetail';
import { inquireService } from '../services/inquireService';
import { answerService } from '../services/answerService';
import { showErrorToast } from '../utils/notificationUtils';
import { useAppSelector } from '../store/hooks';
import { t } from '../utils/translations';
import type {
  InquireContentRef,
  InquireGraphEdge,
  InquireGraphNode,
  InquireGraphResponse,
} from '../types/inquire';

const MAX_NODES = 150;

function mergeGraph(
  base: InquireGraphResponse,
  extra: InquireGraphResponse
): InquireGraphResponse {
  const nodeMap = new Map<string, InquireGraphNode>();
  for (const n of base.nodes) nodeMap.set(`${n.contentType}:${n.id}`, n);
  for (const n of extra.nodes) {
    const key = `${n.contentType}:${n.id}`;
    const prev = nodeMap.get(key);
    if (!prev) {
      nodeMap.set(key, { ...n, onPath: false });
    } else {
      nodeMap.set(key, {
        ...prev,
        ...n,
        onPath: prev.onPath || n.onPath,
      });
    }
  }

  const edgeMap = new Map<string, InquireGraphEdge>();
  for (const e of [...base.edges, ...extra.edges]) {
    const key = `${e.from}->${e.to}:${e.kind}`;
    const prev = edgeMap.get(key);
    edgeMap.set(key, {
      ...e,
      onPath: Boolean(prev?.onPath || e.onPath),
    });
  }

  return {
    paths: base.paths,
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()],
  };
}

async function resolveQuestionId(node: InquireGraphNode): Promise<{
  questionId: string | null;
  highlightAnswerId?: string;
}> {
  if (node.contentType === 'question') {
    return { questionId: node.id };
  }
  const fromNode =
    node.questionId ||
    (node.parent?.contentType === 'question' ? node.parent.id : undefined);
  if (fromNode) {
    return { questionId: fromNode, highlightAnswerId: node.id };
  }
  try {
    const answer = await answerService.getAnswerById(node.id);
    if (answer?.questionId) {
      return { questionId: answer.questionId, highlightAnswerId: node.id };
    }
  } catch {
    // ignore — panel shows not-found
  }
  return { questionId: null };
}

const Inquire: React.FC = () => {
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));
  const { currentLanguage } = useAppSelector(state => state.language);

  const [graph, setGraph] = useState<InquireGraphResponse | null>(null);
  const [pathNodeIds, setPathNodeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<InquireGraphNode | null>(null);
  const [detailQuestionId, setDetailQuestionId] = useState<string | null>(null);
  const [highlightAnswerId, setHighlightAnswerId] = useState<string | undefined>();
  const [detailResolving, setDetailResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearDetail = useCallback(() => {
    setSelectedNode(null);
    setSelectedId(null);
    setDetailQuestionId(null);
    setHighlightAnswerId(undefined);
  }, []);

  useEffect(() => {
    if (!selectedNode) {
      setDetailQuestionId(null);
      setHighlightAnswerId(undefined);
      setDetailResolving(false);
      return;
    }

    let cancelled = false;
    setDetailResolving(true);
    void (async () => {
      const resolved = await resolveQuestionId(selectedNode);
      if (cancelled) return;
      setDetailQuestionId(resolved.questionId);
      setHighlightAnswerId(resolved.highlightAnswerId);
      setDetailResolving(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedNode]);

  const handleSearch = useCallback(
    async (from: InquireContentRef, to: InquireContentRef) => {
      setLoading(true);
      setError(null);
      clearDetail();
      setGraph(null);
      setPathNodeIds([]);
      try {
        const result = await inquireService.findPath(from, to);
        setGraph(result);
        setPathNodeIds(result.paths[0]?.nodeIds || []);
        setSearched(true);
      } catch (e) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ||
          (e instanceof Error ? e.message : 'Inquire failed');
        setError(msg);
        setGraph(null);
        setPathNodeIds([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    },
    [clearDetail]
  );

  const handleSelectNode = useCallback(
    async (node: InquireGraphNode) => {
      setSelectedId(node.id);
      setSelectedNode(node);
      if (!graph) return;
      if (graph.nodes.length >= MAX_NODES) {
        showErrorToast(t('inquire_node_cap', currentLanguage));
        return;
      }
      setExpanding(true);
      try {
        const neighbors = await inquireService.getNeighbors(
          node.contentType,
          node.id,
          1
        );
        setGraph(prev => {
          if (!prev) return neighbors;
          const merged = mergeGraph(prev, {
            ...neighbors,
            nodes: neighbors.nodes.map(n => ({
              ...n,
              onPath: n.onPath || pathNodeIds.includes(n.id),
            })),
            edges: neighbors.edges.map(e => ({
              ...e,
              onPath: false,
            })),
          });
          if (merged.nodes.length > MAX_NODES) {
            showErrorToast(t('inquire_node_cap', currentLanguage));
            return {
              ...merged,
              nodes: merged.nodes.slice(0, MAX_NODES),
            };
          }
          return merged;
        });
      } catch (e) {
        showErrorToast(e instanceof Error ? e.message : 'Expand failed');
      } finally {
        setExpanding(false);
      }
    },
    [graph, pathNodeIds, currentLanguage]
  );

  const empty = !graph || (searched && graph.nodes.length === 0 && !loading);

  const panelWidth = useMemo(() => (isNarrow ? '100%' : 340), [isNarrow]);
  const detailWidth = useMemo(() => (isNarrow ? '100%' : '46%'), [isNarrow]);
  const showDetail = Boolean(selectedNode);

  return (
    <Layout fullWidth>
      <Box
        component="div"
        display="flex"
        flexDirection={isNarrow ? 'column' : 'row'}
        style={{
          height: isNarrow ? 'auto' : 'calc(100vh - 140px)',
          minHeight: isNarrow ? undefined : 520,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          component="div"
          style={{
            width: panelWidth,
            flexShrink: 0,
            borderRight: isNarrow ? 'none' : `1px solid ${theme.palette.divider}`,
            borderBottom: isNarrow ? `1px solid ${theme.palette.divider}` : 'none',
            backgroundColor: theme.palette.background.paper,
            overflow: 'auto',
            maxHeight: isNarrow ? 420 : undefined,
          }}
        >
          <InquireSearchPanel
            currentLanguage={currentLanguage}
            loading={loading}
            lastResult={graph}
            searched={searched}
            onSearch={handleSearch}
          />
        </Box>

        <Box component="div" flex={1} minWidth={0} position="relative" p={1.5}>
          {error && (
            <Alert severity="error" style={{ marginBottom: 8 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {(loading || expanding) && (
            <Box
              component="div"
              display="flex"
              alignItems="center"
              gap={1}
              px={1.5}
              py={0.75}
              borderRadius={1}
              bgcolor="background.paper"
              style={{
                position: 'absolute',
                top: 16,
                right: 24,
                zIndex: 2,
                boxShadow: theme.shadows[1],
              }}
            >
              <CircularProgress size={16} />
              {expanding ? t('inquire_expanding', currentLanguage) : null}
            </Box>
          )}
          <InquireGraphCanvas
            nodes={graph?.nodes || []}
            edges={graph?.edges || []}
            pathNodeIds={pathNodeIds}
            currentLanguage={currentLanguage}
            selectedId={selectedId}
            onSelectNode={n => void handleSelectNode(n)}
            empty={empty || (!graph && !loading)}
            loading={loading}
          />
        </Box>

        {showDetail && (
          <Box
            component="div"
            style={{
              width: detailWidth,
              minWidth: isNarrow ? undefined : 420,
              maxWidth: isNarrow ? undefined : 720,
              flexShrink: 0,
              height: isNarrow ? 560 : '100%',
              maxHeight: isNarrow ? 560 : undefined,
              borderTop: isNarrow ? `1px solid ${theme.palette.divider}` : 'none',
              borderLeft: isNarrow ? 'none' : `1px solid ${theme.palette.divider}`,
              overflow: 'hidden',
              backgroundColor: theme.palette.background.default,
            }}
          >
            {detailResolving ? (
              <Box
                component="div"
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
                minHeight={200}
              >
                <CircularProgress size={28} />
              </Box>
            ) : detailQuestionId ? (
              <QuestionDetail
                key={`${detailQuestionId}:${highlightAnswerId || ''}`}
                questionId={detailQuestionId}
                embedded
                highlightAnswerId={highlightAnswerId}
                onClose={clearDetail}
              />
            ) : (
              <Box component="div" p={2}>
                <Alert severity="error" onClose={clearDetail}>
                  {t('inquire_detail_load_error', currentLanguage)}
                </Alert>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default Inquire;
