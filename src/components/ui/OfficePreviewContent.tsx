import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import { renderAsync } from 'docx-preview';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import {
  loadOfficeArrayBuffer,
  parseExcelWorkbook,
  type ExcelPreviewData,
  type OfficeAssetRef,
  type OfficePreviewKind,
} from '../../utils/officePreview';

interface OfficePreviewContentProps {
  kind: OfficePreviewKind;
  previewUrl: string;
  currentLanguage: string;
  asset?: OfficeAssetRef | null;
}

const OfficePreviewContent: React.FC<OfficePreviewContentProps> = ({
  kind,
  previewUrl,
  currentLanguage,
  asset,
}) => {
  const docxContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [docxBuffer, setDocxBuffer] = React.useState<ArrayBuffer | null>(null);
  const [excelBuffer, setExcelBuffer] = React.useState<ArrayBuffer | null>(null);
  const [excelData, setExcelData] = React.useState<ExcelPreviewData | null>(null);

  const errorText = currentLanguage === 'tr' ? 'Dosya önizlenemedi.' : 'Could not preview file.';
  const legacyText =
    currentLanguage === 'tr'
      ? 'Eski Word (.doc) formatı tarayıcıda önizlenemez. Dosyayı indirerek açabilirsiniz.'
      : 'Legacy Word (.doc) format cannot be previewed in the browser. Download the file to open it.';
  const truncatedText =
    currentLanguage === 'tr'
      ? 'Önizleme ilk 100 satır / 30 sütun ile sınırlıdır.'
      : 'Preview is limited to the first 100 rows / 30 columns.';

  React.useEffect(() => {
    if (!kind || kind === 'legacy_office' || (!previewUrl && !asset?.key)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    setDocxBuffer(null);
    setExcelData(null);
    setExcelBuffer(null);

    (async () => {
      try {
        const buffer = await loadOfficeArrayBuffer(previewUrl, asset);
        if (cancelled) return;
        if (kind === 'docx') {
          setDocxBuffer(buffer);
          setLoading(false);
        } else if (kind === 'xlsx') {
          const data = parseExcelWorkbook(buffer);
          setExcelBuffer(buffer);
          setExcelData(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // asset identity changes often; reload only when identity fields change
    // eslint-disable-next-line react-hooks/exhaustive-deps -- asset?.key/type/entityId/ownerId
  }, [kind, previewUrl, asset?.key, asset?.type, asset?.entityId, asset?.ownerId]);

  React.useEffect(() => {
    if (kind !== 'docx' || !docxBuffer || error) return;
    const container = docxContainerRef.current;
    if (!container) return;

    let cancelled = false;
    container.innerHTML = '';

    (async () => {
      try {
        await renderAsync(docxBuffer, container, undefined, {
          className: 'docx-preview-body',
          inWrapper: true,
          ignoreWidth: true,
          ignoreHeight: true,
          breakPages: false,
          renderHeaders: false,
          renderFooters: false,
        });
        if (cancelled && docxContainerRef.current) {
          docxContainerRef.current.innerHTML = '';
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kind, docxBuffer, error]);

  const handleSheetChange = (_: React.SyntheticEvent, sheetName: string) => {
    if (!excelBuffer) return;
    setExcelData(parseExcelWorkbook(excelBuffer, sheetName));
  };

  if (kind === 'legacy_office') {
    return (
      <Box sx={{ p: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {legacyText}
        </Typography>
        <IconButton size="small" onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}>
          <OpenInNew fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="error">
          {errorText}
        </Typography>
        <IconButton size="small" onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}>
          <OpenInNew fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  if (kind === 'docx' && docxBuffer) {
    return (
      <Box
        ref={docxContainerRef}
        sx={(theme) => ({
          width: '100%',
          height: '100%',
          overflow: 'auto',
          p: 2,
          bgcolor: 'background.paper',
          ...getScrollbarSx(theme),
          '& .docx-wrapper': {
            background: 'transparent',
            padding: 0,
            display: 'block',
          },
          '& .docx-wrapper > section.docx': {
            boxShadow: 'none',
            margin: '0 auto 1rem',
            padding: '24px 28px',
            width: '100%',
            maxWidth: '100%',
            minHeight: 'auto',
            boxSizing: 'border-box',
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
          '& article': {
            color: theme.palette.text.primary,
          },
        })}
      />
    );
  }

  if (kind === 'xlsx' && excelData) {
    const { sheetNames, activeSheet, rows, truncated } = excelData;
    const header = rows[0] ?? [];
    const body = rows.length > 1 ? rows.slice(1) : [];
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {sheetNames.length > 1 && (
          <Tabs
            value={activeSheet}
            onChange={handleSheetChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40, px: 1 }}
          >
            {sheetNames.map((name) => (
              <Tab key={name} value={name} label={name} sx={{ minHeight: 40, textTransform: 'none', fontSize: '0.8rem' }} />
            ))}
          </Tabs>
        )}
        {truncated && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.75 }}>
            {truncatedText}
          </Typography>
        )}
        <TableContainer
          sx={(theme) => ({
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            ...getScrollbarSx(theme),
          })}
        >
          <Table size="small" stickyHeader>
            {header.length > 0 && (
              <TableHead>
                <TableRow>
                  {header.map((cell, i) => (
                    <TableCell
                      key={i}
                      sx={{
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        bgcolor: 'action.hover',
                        fontSize: '0.8rem',
                      }}
                    >
                      {cell || `\u00A0`}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {(header.length > 0 ? body : rows).map((row, ri) => (
                <TableRow key={ri} hover>
                  {row.map((cell, ci) => (
                    <TableCell key={ci} sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                      {cell || `\u00A0`}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      —
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  return null;
};

export default OfficePreviewContent;
