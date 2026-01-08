import { Box, Skeleton as MuiSkeleton, Card, Avatar } from '@mui/material';

export const UserProfileSkeleton = () => {
  return (
    <Card sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
        {/* Profile Avatar */}
        <Avatar sx={{ width: 80, height: 80 }}>
          <MuiSkeleton variant="circular" width={80} height={80} />
        </Avatar>

        <Box sx={{ flex: 1 }}>
          {/* User Name */}
          <MuiSkeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />

          {/* User Email */}
          <MuiSkeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />

          {/* User Stats */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <MuiSkeleton variant="text" width={60} height={20} />
            <MuiSkeleton variant="text" width={60} height={20} />
            <MuiSkeleton variant="text" width={60} height={20} />
          </Box>
        </Box>
      </Box>

      {/* User Bio */}
      <MuiSkeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
      <MuiSkeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
      <MuiSkeleton variant="text" width="60%" height={20} />
    </Card>
  );
};

