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
const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  src,
  ownerId,
  fallbackName,
  ...avatarProps
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src || src === 'default.jpg') {
      setResolvedUrl(null);
      return;
    }
    if (src.startsWith('http')) {
      setResolvedUrl(src);
      return;
    }
    setResolvedUrl(null); // Reset before resolving key
    // Storage key - resolve to URL
    const resolve = async () => {
      try {
        const url = await contentAssetService.resolveAssetUrl({
          key: src,
          type: 'user-profile-avatar',
          ownerId: ownerId || '',
          visibility: 'public',
          presignedUrl: false,
        });
        setResolvedUrl(url);
      } catch {
        setResolvedUrl(null);
      }
    };
    resolve();
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
