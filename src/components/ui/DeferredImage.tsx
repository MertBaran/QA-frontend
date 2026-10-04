import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { ImageOutlined } from '@mui/icons-material';

interface DeferredImageProps {
  src?: string;
  alt: string;
  objectFit?: 'cover' | 'contain';
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
}

/** Görsel adresi veya dosyası hazır olana kadar yerinde bir görsel ikonu durur. */
const DeferredImage: React.FC<DeferredImageProps> = ({
  src,
  alt,
  objectFit = 'cover',
  onError,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  const showIcon = !src || !loaded || failed;
  const cover = objectFit === 'cover';

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: cover ? '100%' : 'auto',
        minHeight: showIcon ? (cover ? '100%' : 140) : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'action.hover',
        overflow: 'hidden',
      }}
    >
      {showIcon && <ImageOutlined sx={{ fontSize: cover ? 28 : 40, color: 'text.disabled' }} />}
      {src && !failed && (
        <Box
          component="img"
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={event => {
            setFailed(true);
            onError?.(event);
          }}
          sx={{
            position: cover ? 'absolute' : 'relative',
            inset: cover ? 0 : undefined,
            width: '100%',
            height: cover ? '100%' : 'auto',
            maxHeight: cover ? undefined : 480,
            objectFit,
            opacity: loaded ? 1 : 0,
            display: 'block',
          }}
        />
      )}
    </Box>
  );
};

export default DeferredImage;
