import { Box, Skeleton as MuiSkeleton, Card, Avatar } from '@mui/material';

export const AnswerSkeleton = () => {
  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* User Avatar */}
        <Avatar sx={{ width: 32, height: 32 }}>
          <MuiSkeleton variant="circular" width={32} height={32} />
        </Avatar>

        <Box sx={{ flex: 1 }}>
          {/* Answer Content */}
          <MuiSkeleton
            variant="text"
            width="100%"
            height={20}
            sx={{ mb: 0.5 }}
          />
          <MuiSkeleton
            variant="text"
            width="90%"
            height={20}
            sx={{ mb: 0.5 }}
          />
          <MuiSkeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />

          {/* Answer Meta */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <MuiSkeleton variant="text" width={60} height={16} />
            <MuiSkeleton variant="text" width={80} height={16} />
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

