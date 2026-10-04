import React, { useEffect, useState } from 'react';
import { userService } from '../../services/userService';
import ProfileAvatar from './ProfileAvatar';

interface UserAvatarByIdProps {
  userId: string | undefined;
  fallbackName?: string;
  sx?: object;
}

/** Fetches user by ID and displays avatar. Use when you only have userId (e.g. from bookmark target_data). */
const UserAvatarById: React.FC<UserAvatarByIdProps> = ({ userId, fallbackName = '?', sx }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfileImage(null);
      return;
    }
    userService
      .getUserById(userId)
      .then((u) => {
        if (u?.profile_image && u.profile_image !== 'default.jpg') {
          setProfileImage(u.profile_image);
        } else {
          setProfileImage(null);
        }
      })
      .catch(() => setProfileImage(null));
  }, [userId]);

  return (
    <ProfileAvatar
      src={profileImage ?? undefined}
      ownerId={userId}
      fallbackName={fallbackName}
      sx={sx}
    />
  );
};

export default UserAvatarById;
