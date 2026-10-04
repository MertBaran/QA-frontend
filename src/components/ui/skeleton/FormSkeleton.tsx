import { Box, Skeleton as MuiSkeleton, Card } from '@mui/material';

export const FormSkeleton = () => {
  return (
    <Card sx={{ p: 3 }}>
      {/* Form Title */}
      <MuiSkeleton variant="text" width="50%" height={32} sx={{ mb: 3 }} />

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <MuiSkeleton variant="rectangular" width="100%" height={56} />
        <MuiSkeleton variant="rectangular" width="100%" height={56} />
        <MuiSkeleton variant="rectangular" width="100%" height={120} />
        <MuiSkeleton variant="rectangular" width={120} height={40} />
      </Box>
    </Card>
  );
};

