import React, { useEffect, useRef, useState } from 'react';
import { Modal, Box, Typography, TextField, IconButton, Pagination, useTheme, Tooltip } from '@mui/material';
import {
  CloudUpload,
  Delete,
  InsertDriveFile,
  Download,
  MoreVert,
  PictureAsPdf,
  Description,
  Article,
  TableChart,
  BrokenImageOutlined,
} from '@mui/icons-material';
import ItemDetailPopup, { truncateDescription } from '../ui/ItemDetailPopup';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';
import { contentAssetService } from '../../services/contentAssetService';
import { showErrorToast } from '../../utils/notificationUtils';
import CreateQuestionLeftModal from './CreateQuestionLeftModal';
import CreateQuestionRightModal from './CreateQuestionRightModal';
import CreateQuestionModal from './CreateQuestionModal';
import type { CreateQuestionLeftState } from './CreateQuestionLeftModal';
import type { CreateQuestionRightState } from './CreateQuestionRightModal';
import { getNegativeActionColor } from '../../utils/themeNegativeColor';

const getEditColor = (themeName: string, mode: 'light' | 'dark', warningMain: string) => {
  if (themeName === 'molume') return '#FF9500';
  if (themeName === 'papirus') return mode === 'dark' ? '#CD853F' : '#D2691E';
  return warningMain;
};

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i;
const PDF_EXTENSIONS = /\.pdf$/i;
const TXT_EXTENSIONS = /\.txt$/i;
const DOCX_EXTENSIONS = /\.docx$/i;
const EXCEL_EXTENSIONS = /\.xlsx?$/i;
const LEGACY_WORD_EXTENSIONS = /\.doc$/i;

function extractFilenameFromKey(key: string): string {
  const lastPart = key.split('/').pop() || '';
  return lastPart.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i, '') || lastPart;
}
function isImageFilename(filename: string): boolean {
  return IMAGE_EXTENSIONS.test(filename);
}
function isPdfFilename(filename: string): boolean {
  return PDF_EXTENSIONS.test(filename);
}
function isTxtFilename(filename: string): boolean {
  return TXT_EXTENSIONS.test(filename);
}
function isDocxFilename(filename: string): boolean {
  return DOCX_EXTENSIONS.test(filename);
}
function isExcelFilename(filename: string): boolean {
  return EXCEL_EXTENSIONS.test(filename);
}
function isLegacyWordFilename(filename: string): boolean {
  return LEGACY_WORD_EXTENSIONS.test(filename);
}
function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || isImageFilename(file.name);
}

const fileThumbIconSx = { fontSize: 28 } as const;

function FileTypeThumbIcon({ filename, mime }: { filename: string; mime?: string }) {
  if (mime === 'application/pdf' || isPdfFilename(filename)) {
    return <PictureAsPdf sx={{ ...fileThumbIconSx, color: (t) => t.palette.error.main }} />;
  }
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/msword' ||
    isDocxFilename(filename) ||
    isLegacyWordFilename(filename)
  ) {
    return <Article sx={{ ...fileThumbIconSx, color: (t) => t.palette.info.main }} />;
  }
  if (
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.ms-excel' ||
    isExcelFilename(filename)
  ) {
    return <TableChart sx={{ ...fileThumbIconSx, color: (t) => t.palette.success.main }} />;
  }
  if (mime === 'text/plain' || isTxtFilename(filename)) {
    return <Description sx={{ ...fileThumbIconSx, color: (t) => t.palette.text.disabled }} />;
  }
  return <InsertDriveFile sx={{ ...fileThumbIconSx, color: (t) => t.palette.text.disabled }} />;
}

/** Kart küçük resmi: sadece görselde img; diğerlerinde tip ikonu; bozuk img'de fallback. */
const FileThumb: React.FC<{
  filename: string;
  mime?: string;
  imageUrl?: string;
}> = ({ filename, mime, imageUrl }) => {
  const [imgFailed, setImgFailed] = React.useState(false);
  const showImage = Boolean(imageUrl) && isImageFilename(filename) && !imgFailed;

  React.useEffect(() => {
    setImgFailed(false);
  }, [imageUrl, filename]);

  return (
    <Box
      sx={(theme) => ({
        width: 48,
        height: 48,
        borderRadius: 0.5,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: theme.palette.action.hover,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gridColumn: 1,
        gridRow: 1,
      })}
    >
      {imgFailed && isImageFilename(filename) ? (
        <BrokenImageOutlined sx={{ ...fileThumbIconSx, color: (t) => t.palette.text.disabled }} />
      ) : (
        <FileTypeThumbIcon filename={filename} mime={mime} />
      )}
      {showImage && (
        <img
          src={imageUrl}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgFailed(true)}
        />
      )}
    </Box>
  );
};

interface AttachedFile {
  id: string;
  file: File;
  description: string;
  previewUrl?: string;
}

interface FileCardToolbarProps {
  onDownload: () => void;
  onRemove: () => void;
  negativeColor: string;
  iconColor: string;
}

const FileCardToolbar: React.FC<FileCardToolbarProps> = ({ onDownload, onRemove, negativeColor, iconColor }) => (
  <Box
    sx={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}
    onClick={(e) => e.stopPropagation()}
  >
    <IconButton size="small" onClick={onDownload} sx={{ p: 0.25, color: iconColor }}>
      <Download sx={{ fontSize: 18 }} />
    </IconButton>
    <IconButton size="small" sx={{ p: 0.25, color: iconColor }}>
      <MoreVert sx={{ fontSize: 18 }} />
    </IconButton>
    <IconButton size="small" onClick={onRemove} sx={{ p: 0.25, color: negativeColor }}>
      <Delete sx={{ fontSize: 18 }} />
    </IconButton>
  </Box>
);

interface FilesSectionToolbarProps {
  onDownloadAll: () => void;
  onEditAll: () => void;
  onDeleteAll: () => void;
  negativeColor: string;
  editColor: string;
  currentLanguage: string;
  disabled: boolean;
}

const FilesSectionToolbar: React.FC<FilesSectionToolbarProps> = ({
  onDownloadAll,
  onEditAll,
  onDeleteAll,
  negativeColor,
  editColor,
  currentLanguage,
  disabled,
}) => {
  const theme = useTheme();
  const iconColor = theme.palette.action.active;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
      <Tooltip title={t('file_download_all', currentLanguage)}>
        <span>
          <IconButton size="small" onClick={onDownloadAll} disabled={disabled} sx={{ p: 0.25, color: iconColor, '&.Mui-disabled': { color: iconColor, opacity: 0.5 } }}>
            <Download sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('file_edit_all', currentLanguage)}>
        <span>
          <IconButton size="small" onClick={onEditAll} disabled={disabled} sx={{ p: 0.25, color: editColor, '&.Mui-disabled': { color: editColor, opacity: 0.5 } }}>
            <MoreVert sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t('file_delete_all', currentLanguage)}>
        <span>
          <IconButton size="small" onClick={onDeleteAll} disabled={disabled} sx={{ p: 0.25, color: negativeColor, '&.Mui-disabled': { color: negativeColor, opacity: 0.5 } }}>
            <Delete sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export interface AttachedFileForSubmit {
  id: string;
  file: File;
  description: string;
}

export interface CreateQuestionSubmitOptions {
  thumbnailFile?: File | null;
  removeThumbnail?: boolean;
  leftState?: CreateQuestionLeftState;
  rightState?: CreateQuestionRightState;
  attachedFiles?: AttachedFileForSubmit[];
}

interface CreateQuestionFlowProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (options: CreateQuestionSubmitOptions) => Promise<void> | void;
  question: {
    summary: string;
    detail: string;
    category: string;
    tags: string;
  };
  onQuestionChange: (field: string, value: string) => void;
  validationErrors: {
    summary?: string;
    detail?: string;
    category?: string;
    tags?: string;
  };
  isSubmitting: boolean;
  currentLanguage: string;
  mode?: 'create' | 'edit';
  initialThumbnailUrl?: string | null;
  initialLeftState?: CreateQuestionLeftState;
  initialRightState?: CreateQuestionRightState;
  /** Edit modunda mevcut soruya ait dosyalar */
  existingAttachments?: { key: string; description?: string }[];
  questionId?: string;
  ownerId?: string;
  /** Soru/cevap hakkında soru sorarken gösterilecek bilgi (özet üstünde) */
  aboutQuestion?: { id: string; summary: string };
  aboutAnswer?: { id: string; content: string };
}

const initialLeftState: CreateQuestionLeftState = {
  visibility: true,
  format: '',
  interest: '',
  focus: '',
  featureTemplateId: '',
  featureFieldValues: {},
};

const initialRightState: CreateQuestionRightState = {
  references: [],
  metadata: [],
};

const FILES_PER_PAGE = 4;

const CreateQuestionFlow: React.FC<CreateQuestionFlowProps> = (props) => {
  const { open, onClose } = props;
  const theme = useTheme();
  const { name: themeName } = useAppSelector((s) => s.theme);
  const negativeColor = getNegativeActionColor(themeName, theme.palette.mode);
  const editColor = getEditColor(themeName, theme.palette.mode, theme.palette.warning.main);
  const [leftState, setLeftState] = useState<CreateQuestionLeftState>(initialLeftState);
  const [rightState, setRightState] = useState<CreateQuestionRightState>(initialRightState);
  const [fileUploadHover, setFileUploadHover] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [filesPage, setFilesPage] = useState(0);
  const [attachmentPreviewUrls, setAttachmentPreviewUrls] = useState<Record<string, string>>({});
  const [hoveredRefIndex, setHoveredRefIndex] = useState<number | null>(null);
  const [fileDetailPopup, setFileDetailPopup] = useState<{
    title: string;
    details: { key: string; value: string }[];
    description: string;
    previewUrl?: string;
    showFileIcon?: boolean;
    officeAsset?: { key: string; type?: 'question-attachment'; entityId?: string; ownerId?: string };
  } | null>(null);
  const hoveredFileId = hoveredRefIndex != null && rightState.references[hoveredRefIndex]?.type === 'dosya'
    ? rightState.references[hoveredRefIndex].content
    : null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingAttachments = props.existingAttachments ?? [];
  const totalFileCount = existingAttachments.length + attachedFiles.length;

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(totalFileCount / FILES_PER_PAGE) - 1);
    setFilesPage((p) => Math.min(p, maxPage));
  }, [totalFileCount]);

  const prevOpenRef = useRef(false);
  useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (justOpened) {
      const left = props.mode === 'edit' && props.initialLeftState
        ? props.initialLeftState
        : initialLeftState;
      const right = props.mode === 'edit' && props.initialRightState
        ? props.initialRightState
        : initialRightState;
      setLeftState(left);
      setRightState(right);
      setFilesPage(0);
      setAttachmentPreviewUrls({});
      setAttachedFiles((prev) => {
        prev.forEach((f) => {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
        });
        return [];
      });
    }
  }, [open, props.mode, props.initialLeftState, props.initialRightState]);

  useEffect(() => {
    const atts = props.existingAttachments ?? [];
    if (!open || atts.length === 0 || !props.questionId || !props.ownerId) return;
    let cancelled = false;
    const loadUrls = async () => {
      const previewUrls: Record<string, string> = {};
      for (const att of atts) {
        try {
          const url = await contentAssetService.resolveAssetUrl({
            key: att.key,
            type: 'question-attachment',
            entityId: props.questionId!,
            ownerId: props.ownerId!,
            download: false,
          });
          if (!cancelled) previewUrls[att.key] = url;
        } catch {
          // ignore
        }
      }
      if (!cancelled) setAttachmentPreviewUrls((prev) => ({ ...prev, ...previewUrls }));
    };
    loadUrls();
    return () => { cancelled = true; };
  }, [open, props.questionId, props.ownerId, props.existingAttachments]);

  const handleDownloadExisting = async (att: { key: string }) => {
    if (!props.questionId || !props.ownerId) return;
    try {
      const blob = await contentAssetService.downloadAsset({
        key: att.key,
        type: 'question-attachment',
        entityId: props.questionId,
        ownerId: props.ownerId,
        filename: extractFilenameFromKey(att.key),
      });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = extractFilenameFromKey(att.key) || 'dosya';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      showErrorToast(t('download_failed', props.currentLanguage));
    }
  };

  const addFilesFromList = (files: FileList | File[]) => {
    const arr = Array.isArray(files) ? files : Array.from(files);
    if (!arr.length) return;
    const newItems: AttachedFile[] = arr.map((file) => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      const isTxt = file.type === 'text/plain' || /\.txt$/i.test(file.name);
      const isDocx =
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        /\.docx$/i.test(file.name);
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        /\.xlsx?$/i.test(file.name);
      const isLegacyWord = file.type === 'application/msword' || /\.doc$/i.test(file.name);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        description: '',
        previewUrl: (isImage || isPdf || isTxt || isDocx || isExcel || isLegacyWord)
          ? URL.createObjectURL(file)
          : undefined,
      };
    });
    setAttachedFiles((prev) => [...prev, ...newItems]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    addFilesFromList(files);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFileUploadHover(false);
    const files = e.dataTransfer.files;
    if (files?.length) addFilesFromList(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
      setFileUploadHover(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setFileUploadHover(false);
    }
  };

  const handleRemoveFile = (id: string) => {
    const item = attachedFiles.find((f) => f.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    const next = attachedFiles.filter((f) => f.id !== id);
    setAttachedFiles(next);
    const maxPage = Math.max(0, Math.ceil(next.length / FILES_PER_PAGE) - 1);
    setFilesPage((p) => Math.min(p, maxPage));
  };

  const handleDescriptionChange = (id: string, description: string) => {
    setAttachedFiles((prev) => prev.map((f) => (f.id === id ? { ...f, description } : f)));
  };

  const handleDownload = (item: AttachedFile) => {
    const url = item.previewUrl || URL.createObjectURL(item.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.file.name;
    a.click();
    if (!item.previewUrl) URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    for (const att of existingAttachments) {
      await handleDownloadExisting(att);
      await new Promise((r) => setTimeout(r, 200));
    }
    attachedFiles.forEach((item) => handleDownload(item));
  };

  const handleDeleteAll = () => {
    attachedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setAttachedFiles([]);
    setFilesPage(0);
  };

  const handleEditAll = () => {
    // Placeholder - will be used later for bulk edit
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: '100vw',
            height: '90vh',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            p: 3,
            gap: 4,
            pointerEvents: 'none',
            '& > *': {
              pointerEvents: 'auto',
            },
          }}
        >
          {/* Sol | Boşluk | Orta | Boşluk | Sağ (sağ: panel + dosya adacığı) */}
          <CreateQuestionLeftModal
            open={open}
            state={leftState}
            onStateChange={setLeftState}
            question={props.question}
            onQuestionChange={props.onQuestionChange}
            validationErrors={props.validationErrors}
            currentLanguage={props.currentLanguage}
            readOnly={props.mode === 'edit'}
          />
          <CreateQuestionModal
            open={open}
            onClose={onClose}
            onSubmit={(opt) =>
              props.onSubmit({
                ...opt,
                leftState,
                rightState,
                attachedFiles: attachedFiles.map((f) => ({
                  id: f.id,
                  file: f.file,
                  description: f.description,
                })),
              })
            }
            question={props.question}
            onQuestionChange={props.onQuestionChange}
            validationErrors={props.validationErrors}
            isSubmitting={props.isSubmitting}
            currentLanguage={props.currentLanguage}
            mode={props.mode}
            initialThumbnailUrl={props.initialThumbnailUrl}
            embedded
            references={rightState.references}
            hoveredRefIndex={hoveredRefIndex}
            onRefHover={setHoveredRefIndex}
            aboutQuestion={props.aboutQuestion}
            aboutAnswer={props.aboutAnswer}
          />
          {/* Sağ kolon: panel + dosya adacığı */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              flexShrink: 0,
              minWidth: 520,
              width: 520,
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <CreateQuestionRightModal
                open={open}
                state={rightState}
                onStateChange={setRightState}
                currentLanguage={props.currentLanguage}
                attachedFiles={attachedFiles.map((f) => ({ id: f.id, file: f.file, description: f.description }))}
                hoveredRefIndex={hoveredRefIndex}
                onRefHover={setHoveredRefIndex}
              />
            </Box>
            <Box
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              sx={(theme) => ({
                flexShrink: 0,
                minWidth: 280,
                minHeight: 320,
                p: 2,
                borderRadius: 2,
                border: `2px dashed ${fileUploadHover ? theme.palette.primary.main : theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[6],
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                transition: 'border-color 0.2s, background-color 0.2s',
                overflow: 'auto',
              })}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500, color: (theme) => theme.palette.text.secondary }}>
                  {t('file_upload_title', props.currentLanguage)}
                </Typography>
                <FilesSectionToolbar
                  onDownloadAll={handleDownloadAll}
                  onEditAll={handleEditAll}
                  onDeleteAll={handleDeleteAll}
                  negativeColor={negativeColor}
                  editColor={editColor}
                  currentLanguage={props.currentLanguage}
                  disabled={totalFileCount === 0}
                />
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              {(() => {
                const combinedList: ({ type: 'existing'; att: { key: string; description?: string } } | { type: 'new'; item: AttachedFile })[] = [
                  ...existingAttachments.map((a) => ({ type: 'existing' as const, att: a })),
                  ...attachedFiles.map((f) => ({ type: 'new' as const, item: f })),
                ];
                const pageFiles = combinedList.slice(filesPage * FILES_PER_PAGE, (filesPage + 1) * FILES_PER_PAGE);
                const count = pageFiles.length;
                const isFullPage = count === FILES_PER_PAGE;
                const uploadAreaStyle = {
                  display: 'flex' as const,
                  flexDirection: 'column' as const,
                  alignItems: 'center' as const,
                  justifyContent: 'center' as const,
                  gap: isFullPage ? 1 : 0.5,
                  cursor: 'pointer' as const,
                  borderRadius: 1,
                  minHeight: isFullPage ? 72 : 60,
                  transition: 'border-color 0.2s, background-color 0.2s',
                };
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
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gridTemplateRows: isFullPage ? '1fr 1fr auto' : count === 0 ? '1fr' : '1fr 1fr',
                      gap: 1.5,
                      minHeight: 220,
                      maxHeight: isFullPage ? 320 : 220,
                      overflow: 'visible',
                    }}
                  >
                    {pageFiles.map((entry, idx) => {
                      const fileNum = filesPage * FILES_PER_PAGE + idx + 1;
                      return entry.type === 'existing' ? (
                        <Box
                          key={`ex-${entry.att.key}`}
                          id={`attachment-${entry.att.key.replace(/[/\\]/g, '_')}`}
                          onClick={() => setFileDetailPopup({
                            title: extractFilenameFromKey(entry.att.key) || 'Dosya',
                            details: [{ key: t('reference_content', props.currentLanguage) || 'Dosya', value: extractFilenameFromKey(entry.att.key) || entry.att.key }],
                            description: entry.att.description || '',
                            previewUrl: attachmentPreviewUrls[entry.att.key],
                            showFileIcon: true,
                            officeAsset: {
                              key: entry.att.key,
                              type: 'question-attachment',
                              entityId: props.questionId,
                              ownerId: props.ownerId,
                            },
                          })}
                          sx={(theme) => ({
                            position: 'relative',
                            overflow: 'visible',
                            p: 1,
                            pl: 2.5,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.background.default,
                            display: 'grid',
                            gridTemplateColumns: '48px 1fr',
                            gridTemplateRows: 'auto auto',
                            gap: '4px 8px',
                            minWidth: 0,
                            transition: 'border-color 0.2s, background-color 0.2s',
                            cursor: 'pointer',
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
                              backgroundColor: (t) => t.palette.action.selected,
                              color: (t) => t.palette.text.secondary,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              boxShadow: (t) => `0 0 0 1px ${t.palette.divider}`,
                            }}
                          >
                            {fileNum}
                          </Typography>
                          <FileThumb
                            filename={extractFilenameFromKey(entry.att.key) || 'Dosya'}
                            imageUrl={attachmentPreviewUrls[entry.att.key]}
                          />
                          <Box sx={{ gridColumn: 2, gridRow: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5, minHeight: 36, minWidth: 0 }}>
                            <Tooltip title={extractFilenameFromKey(entry.att.key) || 'Dosya'} placement="top" enterDelay={300}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 500,
                                  flex: 1,
                                  minWidth: 0,
                                  maxWidth: '100%',
                                  minHeight: 36,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  overflowWrap: 'anywhere',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {extractFilenameFromKey(entry.att.key) || 'Dosya'}
                              </Typography>
                            </Tooltip>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownloadExisting(entry.att); }} sx={{ p: 0.25, flexShrink: 0 }}>
                              <Download sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                          <Box sx={{ gridColumn: 1, gridRow: 2, alignSelf: 'center' }} />
                          <Box sx={{ gridColumn: 2, gridRow: 2, alignSelf: 'center' }}>
                            <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary, fontSize: '0.75rem' }}>
                              {truncateDescription(entry.att.description) || '—'}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          key={entry.item.id}
                          id={`attached-file-${entry.item.id}`}
                          onClick={() => setFileDetailPopup({
                            title: entry.item.file.name || 'Dosya',
                            details: [
                              { key: t('reference_content', props.currentLanguage) || 'Dosya', value: entry.item.file.name || entry.item.file.name },
                              ...(entry.item.file.size != null ? [{ key: t('file_size', props.currentLanguage) || 'Boyut', value: `${(entry.item.file.size / 1024).toFixed(1)} KB` }] : []),
                            ],
                            description: entry.item.description || '',
                            previewUrl: entry.item.previewUrl,
                            showFileIcon: true,
                          })}
                          sx={(theme) => {
                            const isHighlighted = hoveredFileId === entry.item.id;
                            return {
                              position: 'relative',
                              overflow: 'visible',
                              p: 1,
                              pl: 2.5,
                              borderRadius: 1,
                              border: `1px solid ${isHighlighted ? theme.palette.primary.main : theme.palette.divider}`,
                              backgroundColor: isHighlighted ? (theme.palette.mode === 'dark' ? `${theme.palette.primary.main}22` : `${theme.palette.primary.main}15`) : theme.palette.background.default,
                              display: 'grid',
                              gridTemplateColumns: '48px 1fr',
                              gridTemplateRows: 'auto auto',
                              gap: '4px 8px',
                              minWidth: 0,
                              transition: 'border-color 0.2s, background-color 0.2s',
                              cursor: 'pointer',
                            };
                          }}
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
                              backgroundColor: (t) => t.palette.action.selected,
                              color: (t) => t.palette.text.secondary,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              boxShadow: (t) => `0 0 0 1px ${t.palette.divider}`,
                            }}
                          >
                            {fileNum}
                          </Typography>
                          <FileThumb
                            filename={entry.item.file.name}
                            mime={entry.item.file.type}
                            imageUrl={isImageFile(entry.item.file) ? entry.item.previewUrl : undefined}
                          />
                          <Box sx={{ gridColumn: 2, gridRow: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5, minHeight: 36, minWidth: 0 }}>
                            <Tooltip title={entry.item.file.name} placement="top" enterDelay={300}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 500,
                                  flex: 1,
                                  minWidth: 0,
                                  maxWidth: '100%',
                                  minHeight: 36,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  overflowWrap: 'anywhere',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {entry.item.file.name}
                              </Typography>
                            </Tooltip>
                            <FileCardToolbar
                              onDownload={() => handleDownload(entry.item)}
                              onRemove={() => handleRemoveFile(entry.item.id)}
                              negativeColor={negativeColor}
                              iconColor={theme.palette.action.active}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ color: (theme) => theme.palette.text.secondary, fontSize: '0.7rem', gridColumn: 1, gridRow: 2, alignSelf: 'center' }}>
                            {formatFileSize(entry.item.file.size)}
                          </Typography>
                          <Box sx={{ gridColumn: 2, gridRow: 2, alignSelf: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <TextField
                              size="small"
                              placeholder={t('file_upload_description', props.currentLanguage)}
                              value={entry.item.description}
                              onChange={(e) => handleDescriptionChange(entry.item.id, e.target.value)}
                              fullWidth
                              sx={{ '& .MuiInputBase-input': { color: (theme) => theme.palette.text.primary, fontSize: '0.75rem' } }}
                            />
                          </Box>
                        </Box>
                      );
                    })}
                    {uploadGridPlacement ? (
                      <Box
                        sx={(theme) => ({
                          ...uploadAreaStyle,
                          ...(uploadGridPlacement || {}),
                          border: `2px dashed ${fileUploadHover ? theme.palette.primary.main : theme.palette.divider}`,
                          backgroundColor: theme.palette.background.default,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: theme.palette.action.hover,
                          },
                        })}
                        onMouseEnter={() => setFileUploadHover(true)}
                        onMouseLeave={() => setFileUploadHover(false)}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <CloudUpload sx={{ fontSize: isFullPage ? 36 : 28, color: (theme) => theme.palette.text.disabled }} />
                        <Typography variant={isFullPage ? 'body2' : 'caption'} sx={{ color: (theme) => theme.palette.text.secondary, textAlign: 'center', px: 0.5 }}>
                          {t('file_upload_placeholder', props.currentLanguage)}
                        </Typography>
                      </Box>
                    ) : null}
                  </Box>
                );
              })()}
              {totalFileCount > FILES_PER_PAGE && (
                <Pagination
                  count={Math.ceil(totalFileCount / FILES_PER_PAGE)}
                  page={filesPage + 1}
                  onChange={(_, page) => setFilesPage(page - 1)}
                  size="small"
                  color="primary"
                  sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Modal>
      <ItemDetailPopup
        open={!!fileDetailPopup}
        onClose={() => setFileDetailPopup(null)}
        title={fileDetailPopup?.title ?? ''}
        details={fileDetailPopup?.details ?? []}
        description={fileDetailPopup?.description ?? ''}
        currentLanguage={props.currentLanguage}
        descriptionLabel={t('file_upload_description', props.currentLanguage)}
        previewUrl={fileDetailPopup?.previewUrl}
        showFileIcon={fileDetailPopup?.showFileIcon}
        officeAsset={fileDetailPopup?.officeAsset}
      />
    </>
  );
};

export default CreateQuestionFlow;
