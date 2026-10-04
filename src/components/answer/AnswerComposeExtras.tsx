import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Pagination, TextField, Tooltip, Typography } from '@mui/material';
import { CloudUpload, Delete, InsertDriveFile, PictureAsPdf } from '@mui/icons-material';
import CreateQuestionRightModal, {
  type CreateQuestionRightState,
} from '../question/CreateQuestionRightModal';
import ItemDetailPopup from '../ui/ItemDetailPopup';
import { t } from '../../utils/translations';

export type AnswerFileDraft = { id: string; file: File; description: string };

interface AnswerComposeExtrasProps {
  currentLanguage: string;
  references: CreateQuestionRightState['references'];
  onReferencesChange: (references: CreateQuestionRightState['references']) => void;
  metadata: CreateQuestionRightState['metadata'];
  onMetadataChange: (metadata: CreateQuestionRightState['metadata']) => void;
  files: AnswerFileDraft[];
  onFilesChange: (files: AnswerFileDraft[]) => void;
}

const FILES_PER_PAGE = 4;

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const AnswerComposeExtras: React.FC<AnswerComposeExtrasProps> = ({
  currentLanguage,
  references,
  onReferencesChange,
  metadata,
  onMetadataChange,
  files,
  onFilesChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hovering, setHovering] = useState(false);
  const [filePreview, setFilePreview] = useState<{ name: string; url: string; description: string; sizeLabel: string } | null>(null);
  const [page, setPage] = useState(0);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    const created: string[] = [];
    for (const item of files) {
      if (item.file.type.startsWith('image/')) {
        const url = URL.createObjectURL(item.file);
        next[item.id] = url;
        created.push(url);
      }
    }
    setPreviews(next);
    return () => created.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  useEffect(() => {
    const lastPage = Math.max(0, Math.ceil(files.length / FILES_PER_PAGE) - 1);
    if (page > lastPage) setPage(lastPage);
  }, [files.length, page]);

  const addFiles = (selected: File[]) => {
    if (selected.length === 0) return;
    onFilesChange([
      ...files,
      ...selected.map(file => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        description: '',
      })),
    ]);
  };

  const pageFiles = files.slice(page * FILES_PER_PAGE, (page + 1) * FILES_PER_PAGE);
  const count = pageFiles.length;
  const isFullPage = count === FILES_PER_PAGE;
  const uploadGridPlacement = isFullPage
    ? { gridColumn: '1 / -1', gridRow: 3 }
    : count === 0
      ? { gridColumn: '1 / -1', gridRow: '1 / -1' }
      : count === 1
        ? { gridColumn: '2 / -1', gridRow: '1 / -1' }
        : count === 2
          ? { gridColumn: '1 / -1', gridRow: '2 / -1' }
          : { gridColumn: '2 / -1', gridRow: '2 / -1' };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
      <Box sx={{ height: 280, minHeight: 0 }}>
        <CreateQuestionRightModal
          open
          state={{ references, metadata }}
          onStateChange={next => {
            onReferencesChange(next.references);
            onMetadataChange(next.metadata);
          }}
          currentLanguage={currentLanguage}
          attachedFiles={files.map(file => ({
            id: file.id,
            file: file.file,
            description: file.description,
          }))}
        />
      </Box>
      <Box
        onDrop={event => {
          event.preventDefault();
          setHovering(false);
          addFiles(Array.from(event.dataTransfer.files ?? []));
        }}
        onDragOver={event => {
          event.preventDefault();
          setHovering(true);
        }}
        onDragLeave={() => setHovering(false)}
        sx={theme => ({
          p: 1.5,
          borderRadius: 2,
          border: `2px dashed ${hovering ? theme.palette.primary.main : theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
          boxShadow: theme.shadows[2],
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        })}
      >
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          {t('file_upload_title', currentLanguage)}
        </Typography>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={event => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = '';
          }}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: isFullPage ? '1fr 1fr auto' : count === 0 ? '1fr' : '1fr 1fr',
            gap: 1,
            minHeight: count === 0 ? 140 : 180,
          }}
        >
          {pageFiles.map((item, index) => {
            const fileNum = page * FILES_PER_PAGE + index + 1;
            const preview = previews[item.id];
            return (
              <Box
                key={item.id}
                onClick={() => {
                  const url = previews[item.id] || URL.createObjectURL(item.file);
                  setFilePreview({
                    name: item.file.name,
                    url,
                    description: item.description,
                    sizeLabel: formatFileSize(item.file.size),
                  });
                }}
                sx={theme => ({
                  cursor: 'pointer',
                  position: 'relative',
                  p: 1,
                  pl: 2,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.default,
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr',
                  gridTemplateRows: 'auto auto',
                  gap: '4px 8px',
                  minWidth: 0,
                })}
              >
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: -6,
                    left: -6,
                    width: 18,
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    bgcolor: 'action.selected',
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                >
                  {fileNum}
                </Typography>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 0.5,
                    overflow: 'hidden',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gridColumn: 1,
                    gridRow: 1,
                  }}
                >
                  {preview ? (
                    <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : item.file.type === 'application/pdf' || item.file.name.toLowerCase().endsWith('.pdf') ? (
                    <PictureAsPdf sx={{ fontSize: 24, color: 'error.main' }} />
                  ) : (
                    <InsertDriveFile sx={{ fontSize: 24, color: 'text.disabled' }} />
                  )}
                </Box>
                <Box sx={{ gridColumn: 2, gridRow: 1, display: 'flex', alignItems: 'flex-start', gap: 0.5, minWidth: 0 }}>
                  <Tooltip title={item.file.name}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 500,
                        flex: 1,
                        minWidth: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                      }}
                    >
                      {item.file.name}
                    </Typography>
                  </Tooltip>
                  <IconButton
                    size="small"
                    aria-label={t('file_upload_remove', currentLanguage)}
                    onClick={event => {
                      event.stopPropagation();
                      onFilesChange(files.filter(file => file.id !== item.id));
                    }}
                    sx={{ p: 0.25 }}
                  >
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                <Typography variant="caption" sx={{ gridColumn: 1, gridRow: 2, alignSelf: 'center', color: 'text.secondary', fontSize: '0.7rem' }}>
                  {formatFileSize(item.file.size)}
                </Typography>
                <TextField
                  size="small"
                  placeholder={t('file_upload_description', currentLanguage)}
                  value={item.description}
                  onClick={event => event.stopPropagation()}
                  onChange={event =>
                    onFilesChange(
                      files.map(file =>
                        file.id === item.id ? { ...file, description: event.target.value } : file
                      )
                    )
                  }
                  sx={{ gridColumn: 2, gridRow: 2, '& .MuiInputBase-input': { fontSize: '0.75rem' } }}
                />
              </Box>
            );
          })}
          <Box
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            sx={theme => ({
              ...uploadGridPlacement,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              cursor: 'pointer',
              borderRadius: 1,
              minHeight: count === 0 ? 120 : 64,
              border: `2px dashed ${hovering ? theme.palette.primary.main : theme.palette.divider}`,
              backgroundColor: theme.palette.background.default,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              },
            })}
          >
            <CloudUpload sx={{ fontSize: count === 0 ? 36 : 28, color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', px: 0.5 }}>
              {t('file_upload_placeholder', currentLanguage)}
            </Typography>
          </Box>
        </Box>
        {files.length > FILES_PER_PAGE && (
          <Pagination
            count={Math.ceil(files.length / FILES_PER_PAGE)}
            page={page + 1}
            onChange={(_, next) => setPage(next - 1)}
            size="small"
            color="primary"
            sx={{ display: 'flex', justifyContent: 'center' }}
          />
        )}
      </Box>
      <ItemDetailPopup
        open={!!filePreview}
        onClose={() => setFilePreview(null)}
        title={filePreview?.name ?? ''}
        details={filePreview ? [{ key: t('file_size', currentLanguage), value: filePreview.sizeLabel }] : []}
        description={filePreview?.description ?? ''}
        currentLanguage={currentLanguage}
        descriptionLabel={t('reference_description', currentLanguage)}
        previewUrl={filePreview?.url}
        showFileIcon
      />
    </Box>
  );
};

export default AnswerComposeExtras;
