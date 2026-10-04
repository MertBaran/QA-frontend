import React, { useEffect, useState } from 'react';
import { Avatar, AvatarProps } from '@mui/material';
import { contentAssetService } from '../../services/contentAssetService';

interface ProfileAvatarProps extends Omit<AvatarProps, 'src'> {
  src?: string | null;
  ownerId?: string;
  fallbackName?: string;
}

/**
 * Avatar component that resolves profile image URLs from storage keys.
 * Use when profile_image/avatar might be a storage key instead of HTTP URL.
 */
const avatarUrlCache = new Map<string, string>();

function initialAvatarUrl(src?: string | null): string | null {
  if (!src || src === 'default.jpg') return null;
  if (src.startsWith('http')) return src;
  return avatarUrlCache.get(`${src}`) ?? null;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  ownerId,
  fallbackName,
  ...avatarProps
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(() => initialAvatarUrl(src));

  useEffect(() => {
    if (!src || src === 'default.jpg') {
      setResolvedUrl(null);
      return;
    }
    if (src.startsWith('http')) {
      setResolvedUrl(src);
      return;
    }
    const cached = avatarUrlCache.get(src);
    if (cached) {
      setResolvedUrl(cached);
      return;
    }
    let cancelled = false;
    const resolve = async () => {
      try {
        const url = await contentAssetService.resolveAssetUrl({
          key: src,
          type: 'user-profile-avatar',
          ownerId: ownerId || '',
          visibility: 'public',
          presignedUrl: false,
        });
        avatarUrlCache.set(src, url);
        if (!cancelled) setResolvedUrl(url);
      } catch {
        if (!cancelled) setResolvedUrl(null);
      }
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, [src, ownerId]);

  const displaySrc = resolvedUrl ?? (src?.startsWith('http') ? src : null);

  return (
    <Avatar
      src={displaySrc ?? undefined}
      {...avatarProps}
    >
      {!displaySrc && fallbackName ? fallbackName.charAt(0).toUpperCase() : avatarProps.children}
    </Avatar>
  );
};

export default ProfileAvatar;
