import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import InquireContentPicker from './InquireContentPicker';
import { t } from '../../utils/translations';
import type { InquireContentRef, InquireGraphResponse } from '../../types/inquire';

type Mode = 'link' | 'ai';

interface Props {
  currentLanguage: string;
  loading: boolean;
  lastResult: InquireGraphResponse | null;
  searched: boolean;
  onSearch: (from: InquireContentRef, to: InquireContentRef) => void;
}

function formatSummary(
  template: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
    template
  );
}

const InquireSearchPanel: React.FC<Props> = ({
  currentLanguage,
  loading,
  lastResult,
  searched,
  onSearch,
}) => {
  const [mode, setMode] = useState<Mode>('link');
  const [from, setFrom] = useState<InquireContentRef | null>(null);
  const [to, setTo] = useState<InquireContentRef | null>(null);
  const [aiText, setAiText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSearch = () => {
    setLocalError(null);
    if (!from?.id || !to?.id) {
      setLocalError(t('inquire_select_both', currentLanguage));
      return;
    }
    onSearch(from, to);
  };

  return (
    <Box component="div" height="100%" display="flex" flexDirection="column" gap={2} p={2}>
      <Box component="div">
        <Typography variant="h6" mb={0.5}>
          {t('inquire_page_title', currentLanguage)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('inquire_page_subtitle', currentLanguage)}
        </Typography>
      </Box>

      <Tabs
        value={mode}
        onChange={(_e, v) => setMode(v as Mode)}
        variant="fullWidth"
      >
        <Tab value="link" label={t('inquire_mode_link', currentLanguage)} />
        <Tab value="ai" label={t('inquire_mode_ai', currentLanguage)} />
      </Tabs>

      {mode === 'ai' ? (
        <Box component="div" display="flex" flexDirection="column" gap={1.5}>
          <TextField
            multiline
            minRows={4}
            value={aiText}
            onChange={e => setAiText(e.target.value)}
            placeholder={t('inquire_ai_placeholder', currentLanguage)}
            disabled
          />
          <Alert severity="info">{t('inquire_ai_coming_soon', currentLanguage)}</Alert>
          <Button variant="contained" disabled>
            {t('inquire_search', currentLanguage)}
          </Button>
        </Box>
      ) : (
        <Box component="div" display="flex" flexDirection="column" gap={2} flex={1}>
          <InquireContentPicker
            label={t('inquire_from', currentLanguage)}
            value={from}
            onChange={setFrom}
            currentLanguage={currentLanguage}
          />
          <InquireContentPicker
            label={t('inquire_to', currentLanguage)}
            value={to}
            onChange={setTo}
            currentLanguage={currentLanguage}
          />

          {localError && <Alert severity="warning">{localError}</Alert>}

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {t('inquire_search', currentLanguage)}
          </Button>

          <Divider />

          {searched && lastResult && (
            <Box component="div">
              {lastResult.paths.length === 0 ? (
                <Alert severity="info">{t('inquire_no_path', currentLanguage)}</Alert>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {formatSummary(t('inquire_path_found', currentLanguage), {
                    paths: lastResult.paths.length,
                    nodes: lastResult.nodes.length,
                    edges: lastResult.edges.length,
                  })}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                {t('inquire_click_expand', currentLanguage)}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default InquireSearchPanel;
