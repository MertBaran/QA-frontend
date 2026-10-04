import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { contentAssetService } from '../../services/contentAssetService';
import { t } from '../../utils/translations';
import { useAppSelector } from '../../store/hooks';

const VOICE_PREFIX = '[voice]';
const VOICE_KEY_PREFIX = '[voice]key:';

interface VoiceMessagePlayerProps {
  content: string;
  style?: React.CSSProperties;
}

/**
 * Ses mesajı oynatıcı. Mesaj içeriği [voice]url veya [voice]key:storageKey formatında olabilir.
 * key formatında saklanan sesler için her gösterimde taze presigned URL alınır (eski URL'lerin süresi dolduğu için).
 */
const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ content, style }) => {
  const { currentLanguage } = useAppSelector((s) => s.language);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!content?.startsWith(VOICE_PREFIX)) return;

    if (content.startsWith(VOICE_KEY_PREFIX)) {
      const key = content.slice(VOICE_KEY_PREFIX.length);
      const parts = key.split('/');
      const ownerId = parts[1]; // message-voice/{ownerId}/{uuid}-voice.webm

      contentAssetService
        .resolveAssetUrl({
          key,
          type: 'message-voice',
          ownerId,
          visibility: 'private',
          expiresInSeconds: 3600,
        })
        .then((url) => {
          setSrc(url);
          setError(false);
        })
        .catch(() => setError(true));
    } else {
      const url = content.slice(VOICE_PREFIX.length).trim();
      setSrc(url || null);
      setError(!url);
    }
  }, [content]);

  const handleAudioError = () => setError(true);

  if (error) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('voice_load_failed', currentLanguage)}
      </Typography>
    );
  }

  if (!src) {
    return (
      <Box component="span" sx={{ display: 'inline-block', width: 200, height: 32, bgcolor: 'action.hover', borderRadius: 1 }} />
    );
  }

  return <audio controls src={src} onError={handleAudioError} style={{ maxWidth: '100%', height: 32, ...style }} />;
};

export default VoiceMessagePlayer;
