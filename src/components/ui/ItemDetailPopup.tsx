import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Typography, IconButton, Tooltip, CircularProgress } from '@mui/material';
import {
  OpenInNew,
  YouTube,
  InsertDriveFile,
  PictureAsPdf,
  Description,
  Close,
  Article,
  TableChart,
} from '@mui/icons-material';
import { getScrollbarSx } from '../../theme/scrollbarStyles';
import ProfileAvatar from './ProfileAvatar';
import OfficePreviewContent from './OfficePreviewContent';
import { stripRefLinksForDisplay } from '../../utils/refLinkDisplay';
import { getOfficePreviewKind, type OfficeAssetRef } from '../../utils/officePreview';

const DESCRIPTION_TRUNCATE_LENGTH = 50;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i;
const PDF_EXTENSIONS = /\.pdf(\?|$)/i;
const TXT_EXTENSIONS = /\.txt(\?|$)/i;

type PreviewKind = 'image' | 'pdf' | 'txt' | 'docx' | 'xlsx' | 'legacy_office' | 'other';

function getPreviewKind(filename: string): PreviewKind {
  const name = (filename || '').trim();
  if (IMAGE_EXTENSIONS.test(name)) return 'image';
  if (PDF_EXTENSIONS.test(name)) return 'pdf';
  if (TXT_EXTENSIONS.test(name)) return 'txt';
  const office = getOfficePreviewKind(name);
  if (office) return office;
  return 'other';
}

export function truncateDescription(text: string | undefined, maxLen = DESCRIPTION_TRUNCATE_LENGTH): string {
  const t = (text || '').trim();
  if (!t) return '';
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen) + '...';
}

export function isDescriptionLong(text: string | undefined, maxLen = DESCRIPTION_TRUNCATE_LENGTH): boolean {
  return ((text || '').trim().length ?? 0) > maxLen;
}

interface ItemDetailPopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  details?: { key: string; value: string }[];
  description?: string;
  currentLanguage: string;
  descriptionLabel?: string;
  linkOpenLabel?: string;
  /** Soru/cevap targetUrl butonu için tooltip */
  targetOpenLabel?: string;
  youtubePreviewLabel?: string;
  /** Dosya önizlemesi (sol üst) - görsel veya showFileIcon ile ikon */
  previewUrl?: string;
  /** Dosya ama görsel değilse ikon göster */
  showFileIcon?: boolean;
  /** Office önizleme için API download fallback */
  officeAsset?: OfficeAssetRef | null;
  /** Link referansı - Linke git butonu */
  linkUrl?: string;
  /** Dosya ve link detayı aynı genişlikte açılır */
  wide?: boolean;
  /** Soru/cevap referansı - Yeni sekmede soru/cevaba git */
  targetUrl?: string;
  /** YouTube - Önizle butonu */
  youtubeData?: { videoId: string; startSeconds: number };
  onYoutubePreview?: (data: { videoId: string; startSeconds: number }) => void;
  /** Soru/cevap referansı için: avatar, isim, başlık, içerik */
  avatarSrc?: string;
  authorName?: string;
  ownerId?: string;
  contentTitle?: string;
  contentBody?: string;
  /** contentBody için etiket (örn. "Soru detayı", "Cevap") */
  contentBodyLabel?: string;
}

const ItemDetailPopup: React.FC<ItemDetailPopupProps> = ({
  open,
  onClose,
  title,
  details = [],
  description = '',
  currentLanguage,
  descriptionLabel = 'Açıklama',
  linkOpenLabel = 'Linke git',
  targetOpenLabel,
  youtubePreviewLabel = 'Önizle',
  previewUrl,
  showFileIcon,
  officeAsset,
  linkUrl,
  wide = false,
  targetUrl,
  youtubeData,
  onYoutubePreview,
  avatarSrc,
  authorName,
  ownerId,
  contentTitle,
  contentBody,
  contentBodyLabel = 'İçerik',
}) => {
  const [imgError, setImgError] = React.useState(false);
  const [fullPreviewOpen, setFullPreviewOpen] = React.useState(false);
  const [txtContent, setTxtContent] = React.useState<string | null>(null);
  const [txtLoading, setTxtLoading] = React.useState(false);
  const [txtError, setTxtError] = React.useState(false);

  const previewKind = getPreviewKind(title);
  const showPreviewBox = previewUrl || showFileIcon;
  const isSoruCevapView = !!(avatarSrc || authorName) && !!(contentTitle || contentBody);

  const isKnownImage = previewKind === 'image' && !!previewUrl && !imgError;
  const isDetectedImage = previewKind === 'other' && !!previewUrl && !imgError;
  const isImagePreview = isKnownImage || isDetectedImage;
  const isPdfPreview = previewKind === 'pdf' && !!previewUrl;
  const isTxtPreview = previewKind === 'txt' && !!previewUrl;
  const hasOfficeSource = !!(previewUrl || officeAsset?.key);
  const isDocxPreview = previewKind === 'docx' && hasOfficeSource;
  const isXlsxPreview = previewKind === 'xlsx' && hasOfficeSource;
  const isLegacyOfficePreview = previewKind === 'legacy_office' && hasOfficeSource;
  const isOfficePreview = isDocxPreview || isXlsxPreview || isLegacyOfficePreview;
  const canOpenFullPreview =
    isImagePreview || isPdfPreview || isTxtPreview || isOfficePreview;

  const isDocumentKind =
    previewKind === 'pdf' ||
    previewKind === 'txt' ||
    previewKind === 'docx' ||
    previewKind === 'xlsx' ||
    previewKind === 'legacy_office';

  const showFileIconFallback =
    showFileIcon &&
    (isDocumentKind || !previewUrl || ((previewKind === 'image' || previewKind === 'other') && imgError));

  React.useEffect(() => {
    if (!open) {
      setImgError(false);
      setFullPreviewOpen(false);
      setTxtContent(null);
      setTxtLoading(false);
      setTxtError(false);
    }
  }, [open]);

  React.useEffect(() => {
    if (!fullPreviewOpen || !isTxtPreview || !previewUrl) return;
    let cancelled = false;
    setTxtLoading(true);
    setTxtError(false);
    setTxtContent(null);
    fetch(previewUrl)
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setTxtContent(text);
          setTxtLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTxtError(true);
          setTxtLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fullPreviewOpen, isTxtPreview, previewUrl]);

  const openFullPreview = () => {
    if (canOpenFullPreview) setFullPreviewOpen(true);
  };

  const PreviewThumbIcon =
    previewKind === 'pdf'
      ? PictureAsPdf
      : previewKind === 'docx' || previewKind === 'legacy_office'
        ? Article
        : previewKind === 'xlsx'
          ? TableChart
          : previewKind === 'txt'
            ? Description
            : InsertDriveFile;

  const previewIconColor = (t: { palette: { error: { main: string }; success: { main: string }; info: { main: string }; text: { disabled: string } } }) => {
    if (previewKind === 'pdf') return t.palette.error.main;
    if (previewKind === 'docx' || previewKind === 'legacy_office') return t.palette.info.main;
    if (previewKind === 'xlsx') return t.palette.success.main;
    return t.palette.text.disabled;
  };

  const isDocumentPreviewDialog =
    isPdfPreview || isTxtPreview || isOfficePreview;
  const roomy = !isSoruCevapView && (wide || !!showFileIcon);

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: roomy ? 640 : 420,
          borderRadius: 2,
          mx: 2,
        },
      }}
      slotProps={{
        backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.4)' } },
      }}
    >
      <DialogTitle sx={{ typography: 'body1', fontWeight: 600, pb: 0, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {showPreviewBox && !isSoruCevapView && (
          <Box
            component={canOpenFullPreview ? 'button' : 'div'}
            type={canOpenFullPreview ? 'button' : undefined}
            onClick={canOpenFullPreview ? openFullPreview : undefined}
            sx={{
              width: 56,
              height: 56,
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              backgroundColor: (t) => t.palette.action.hover,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              border: 'none',
              padding: 0,
              cursor: canOpenFullPreview ? 'pointer' : 'default',
              '&:hover': canOpenFullPreview ? { opacity: 0.9 } : {},
            }}
          >
            {(previewKind === 'image' || previewKind === 'other') && previewUrl && !imgError ? (
              <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} onError={() => setImgError(true)} />
            ) : null}
            {(isPdfPreview || isTxtPreview || isOfficePreview || showFileIconFallback) && !isImagePreview && (
              <PreviewThumbIcon sx={{ fontSize: 28, color: previewIconColor }} />
            )}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, width: '100%' }}>
            <Tooltip title={title} enterDelay={400}>
              <Box
                component="span"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </Box>
            </Tooltip>
            {youtubeData && onYoutubePreview && (
              <Tooltip title={youtubePreviewLabel}>
                <IconButton size="small" onClick={() => onYoutubePreview(youtubeData)} sx={{ color: '#FF0000' }}>
                  <YouTube fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {linkUrl && !youtubeData && (
              <Tooltip title={linkOpenLabel}>
                <IconButton size="small" onClick={() => window.open(linkUrl, '_blank', 'noopener,noreferrer')}>
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {targetUrl && isSoruCevapView && (
              <Tooltip title={targetOpenLabel ?? linkOpenLabel}>
                <IconButton size="small" onClick={() => window.open(targetUrl, '_blank', 'noopener,noreferrer')}>
                  <OpenInNew fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {isSoruCevapView && (
            <Box
              component={ownerId ? 'button' : 'div'}
              type={ownerId ? 'button' : undefined}
              onClick={ownerId ? () => window.open(`${window.location.origin}/profile/${ownerId}`, '_blank', 'noopener,noreferrer') : undefined}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                border: 'none',
                background: 'none',
                padding: 0,
                cursor: ownerId ? 'pointer' : 'default',
                '&:hover': ownerId ? { opacity: 0.85 } : {},
              }}
            >
              <ProfileAvatar
                src={avatarSrc || undefined}
                ownerId={ownerId}
                fallbackName={authorName}
                sx={{ width: 48, height: 48, flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: (t) => t.palette.text.primary }}>
                  {authorName ?? '—'}
                </Typography>
                {contentTitle && (
                  <Typography variant="caption" sx={{ color: (t) => t.palette.text.secondary, display: 'block' }}>
                    {contentTitle}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          {isSoruCevapView && contentBody && (
            <Box>
              <Typography variant="caption" sx={{ color: (t) => t.palette.text.secondary, fontWeight: 600 }}>
                {contentBodyLabel}:
              </Typography>
              <Box
                component="textarea"
                readOnly
                value={stripRefLinksForDisplay(contentBody)}
                sx={(theme) => ({
                  display: 'block',
                  width: '100%',
                  minHeight: 80,
                  maxHeight: 200,
                  mt: 0.5,
                  p: 1.5,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.action.hover,
                  color: theme.palette.text.primary,
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'none',
                  overflow: 'auto',
                  ...getScrollbarSx(theme),
                })}
              />
            </Box>
          )}
          {!isSoruCevapView && details.map((d, i) => (
            <Box key={i}>
              <Typography variant="caption" sx={{ color: (t) => t.palette.text.secondary, fontWeight: 600 }}>
                {d.key}:
              </Typography>
              <Typography variant="body2" sx={{ color: (t) => t.palette.text.primary, wordBreak: 'break-all' }}>
                {d.value}
              </Typography>
            </Box>
          ))}
          {(description?.trim() || !isSoruCevapView) && (
          <Box>
            <Typography variant="caption" sx={{ color: (t) => t.palette.text.secondary, fontWeight: 600 }}>
              {descriptionLabel}:
            </Typography>
            <Box
              component="textarea"
              readOnly
              value={stripRefLinksForDisplay(description) || '—'}
              sx={(theme) => ({
                display: 'block',
                width: '100%',
                minHeight: roomy ? 140 : 80,
                maxHeight: roomy ? 320 : 200,
                mt: 0.5,
                p: 1.5,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'none',
                overflow: 'auto',
                ...getScrollbarSx(theme),
              })}
            />
          </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
    {canOpenFullPreview && fullPreviewOpen && (
      <Dialog
        open={fullPreviewOpen}
        onClose={() => setFullPreviewOpen(false)}
        maxWidth={false}
        PaperProps={{
          sx: {
            maxWidth: isImagePreview ? '95vw' : '90vw',
            width: isImagePreview ? 'auto' : '90vw',
            maxHeight: '95vh',
            height: isPdfPreview || isOfficePreview ? '90vh' : 'auto',
            backgroundColor: isImagePreview ? 'transparent' : 'background.paper',
            boxShadow: isImagePreview ? 'none' : undefined,
            borderRadius: isImagePreview ? 0 : 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        slotProps={{
          backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.85)', cursor: 'pointer' } },
        }}
      >
        {!isImagePreview && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ pr: 1, flex: 1, minWidth: 0 }}>
              {title}
            </Typography>
            <IconButton size="small" onClick={() => setFullPreviewOpen(false)} aria-label="close">
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}
        <DialogContent
          sx={{
            p: 0,
            overflow: 'hidden',
            display: 'flex',
            alignItems: isImagePreview ? 'center' : 'stretch',
            justifyContent: 'center',
            flex: 1,
            minHeight: isDocumentPreviewDialog ? 0 : undefined,
            height: isPdfPreview || isOfficePreview ? '100%' : isTxtPreview ? '70vh' : undefined,
          }}
        >
          {isImagePreview && (
            <img
              src={previewUrl}
              alt=""
              style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }}
            />
          )}
          {isPdfPreview && (
            <Box
              component="iframe"
              src={previewUrl}
              title={title}
              sx={{
                border: 'none',
                width: '100%',
                height: '100%',
                minHeight: '70vh',
                bgcolor: 'background.default',
              }}
            />
          )}
          {isTxtPreview && (
            <Box
              sx={(theme) => ({
                width: '100%',
                height: '100%',
                overflow: 'auto',
                p: 2,
                ...getScrollbarSx(theme),
              })}
            >
              {txtLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                  <CircularProgress size={28} />
                </Box>
              )}
              {txtError && (
                <Box sx={{ textAlign: 'center', py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="error">
                    {currentLanguage === 'tr' ? 'Dosya önizlenemedi.' : 'Could not preview file.'}
                  </Typography>
                  {previewUrl && (
                    <IconButton size="small" onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}>
                      <OpenInNew fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              )}
              {!txtLoading && !txtError && txtContent != null && (
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    color: 'text.primary',
                  }}
                >
                  {txtContent}
                </Box>
              )}
            </Box>
          )}
          {isOfficePreview && (previewUrl || officeAsset?.key) && (
            <Box sx={{ width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <OfficePreviewContent
                kind={previewKind === 'docx' || previewKind === 'xlsx' || previewKind === 'legacy_office' ? previewKind : null}
                previewUrl={previewUrl || ''}
                currentLanguage={currentLanguage}
                asset={officeAsset}
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    )}
    </>
  );
};

export default ItemDetailPopup;
