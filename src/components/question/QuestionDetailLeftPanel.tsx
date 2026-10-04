import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { t } from '../../utils/translations';
import type { Question } from '../../types/question';
import type { FeatureTableRow, TableColumnDef } from '../../types/questionFeatureTemplate';
import { formatFeatureTableCellDisplay } from '../../utils/featureTemplateUtils';
import {
  featureTemplateTableCellSx,
  featureTemplateTableGridSx,
  featureTemplateTableHeadCellSx,
} from './FeatureTemplateFieldsEditor';

export interface QuestionDetailFeatureFieldRow {
  title: string;
  summary: string;
  detail: string;
  tableData?: { columns: TableColumnDef[]; rows: FeatureTableRow[] };
}

interface QuestionDetailLeftPanelProps {
  question: Question;
  currentLanguage: string;
  featureTemplateName?: string | null;
  featureFieldRows?: QuestionDetailFeatureFieldRow[];
  showFocus?: boolean;
}

const QuestionDetailLeftPanel: React.FC<QuestionDetailLeftPanelProps> = ({
  question,
  currentLanguage,
  featureTemplateName,
  featureFieldRows = [],
  showFocus = false,
}) => {
  const visibility = question.visibility ?? true;
  const format = question.format ?? '';
  const interest = question.interest ?? '';
  const focus = question.focus;
  const category = question.category ?? '';
  const tags = question.tags ?? [];
  const [openDetail, setOpenDetail] = useState<QuestionDetailFeatureFieldRow | null>(null);

  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        minWidth: 0,
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        background:
          theme.palette.mode === 'dark'
            ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
            : `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        boxShadow: theme.shadows[8],
        overflow: 'auto',
        boxSizing: 'border-box',
      })}
    >
      <Box sx={{ p: 3, pt: 4, pr: 5, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.primary, fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.2 }}>
            {t('visibility', currentLanguage)}
          </Typography>
          {visibility ? (
            <Visibility sx={{ fontSize: 32, color: (theme) => theme.palette.primary.main }} />
          ) : (
            <VisibilityOff sx={{ fontSize: 32, color: (theme) => theme.palette.text.secondary }} />
          )}
        </Box>
        {format && (
          <Box>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, display: 'block', mb: 0.5, fontSize: '0.95rem' }}>
              {t('format', currentLanguage)}
            </Typography>
            <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.primary, fontSize: '1.05rem' }}>
              {t(format, currentLanguage)}
            </Typography>
          </Box>
        )}
        {interest && (
          <Box>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, display: 'block', mb: 0.5, fontSize: '0.95rem' }}>
              {t('interest', currentLanguage)}
            </Typography>
            <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.primary, fontSize: '1.05rem' }}>
              {t(interest, currentLanguage)}
            </Typography>
          </Box>
        )}
        {category && (
          <Box>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, display: 'block', mb: 0.5, fontSize: '0.95rem' }}>
              {t('category', currentLanguage)}
            </Typography>
            <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.primary, fontSize: '1.05rem' }}>
              {category}
            </Typography>
          </Box>
        )}
        {tags.length > 0 && (
          <Box>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, display: 'block', mb: 1, fontSize: '0.95rem' }}>
              {t('tags', currentLanguage)}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {tags.map((tag) => (
                <Chip key={tag} label={tag} size="medium" sx={{ '& .MuiChip-label': { color: (theme) => theme.palette.text.primary, fontSize: '0.95rem' } }} />
              ))}
            </Box>
          </Box>
        )}
        {showFocus && focus != null && focus >= 1 && focus <= 10 && (
          <Box>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, display: 'block', mb: 0.5, fontSize: '0.95rem' }}>
              {t('focus', currentLanguage)}
            </Typography>
            <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.primary, fontSize: '1.05rem' }}>
              {focus}
            </Typography>
          </Box>
        )}
        {featureTemplateName && featureFieldRows.length > 0 && (
          <Box>
            <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary, display: 'block', mb: 1, fontSize: '0.95rem' }}>
              {t('feature_template_section', currentLanguage)}: {featureTemplateName}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {featureFieldRows.map((row, index) => (
                <Box key={`feature-field-${index}`}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => setOpenDetail(row)}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', py: 0.75 }}
                  >
                    <Box sx={{ textAlign: 'left', width: '100%', minWidth: 0 }}>
                      <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary }}>
                        {row.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.primary }} noWrap>
                        {row.summary}
                      </Typography>
                    </Box>
                  </Button>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Dialog
        open={!!openDetail}
        onClose={() => setOpenDetail(null)}
        maxWidth={openDetail?.tableData ? 'md' : 'sm'}
        fullWidth
      >
        {openDetail ? (
          <>
            <DialogTitle>{openDetail.title}</DialogTitle>
            <DialogContent>
              {openDetail.tableData && openDetail.tableData.columns.length > 0 ? (
                <Box sx={{ overflowX: 'auto', mt: 0.5 }}>
                  <Table size="small" sx={featureTemplateTableGridSx}>
                    <TableHead>
                      <TableRow>
                        {openDetail.tableData.columns.map((c) => (
                          <TableCell key={c.columnId} sx={{ ...featureTemplateTableHeadCellSx, minWidth: 140 }}>
                            {c.title}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {openDetail.tableData.rows.map((row, ri) => (
                        <TableRow key={ri}>
                          {openDetail.tableData!.columns.map((c) => (
                            <TableCell key={c.columnId} sx={featureTemplateTableCellSx}>
                              <Typography
                                variant="body2"
                                component="div"
                                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                              >
                                {formatFeatureTableCellDisplay(c, row[c.columnId])}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              ) : (
                <Typography
                  component="pre"
                  variant="body2"
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit' }}
                >
                  {openDetail.detail}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDetail(null)}>{t('feature_templates_modal_done', currentLanguage)}</Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
};

export default QuestionDetailLeftPanel;
