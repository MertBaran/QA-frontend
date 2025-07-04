import { Box, Skeleton as MuiSkeleton, Card, Avatar } from '@mui/material';

// Question Skeleton
export const QuestionSkeleton = () => {
  return (
    <Card sx={{ mb: 2, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* User Avatar */}
        <Avatar sx={{ width: 40, height: 40 }}>
          <MuiSkeleton variant="circular" width={40} height={40} />
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          {/* Question Title */}
          <MuiSkeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
          
          {/* Question Content */}
          <MuiSkeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
          <MuiSkeleton variant="text" width="90%" height={20} sx={{ mb: 0.5 }} />
          <MuiSkeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />
          
          {/* Question Meta */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <MuiSkeleton variant="text" width={80} height={16} />
            <MuiSkeleton variant="text" width={60} height={16} />
            <MuiSkeleton variant="text" width={100} height={16} />
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

// Questions List Skeleton
export const QuestionsListSkeleton = ({ count = 5 }) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <QuestionSkeleton key={index} />
      ))}
    </Box>
  );
};

// User Profile Skeleton
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

// Form Skeleton
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

// Answer Skeleton
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
          <MuiSkeleton variant="text" width="100%" height={20} sx={{ mb: 0.5 }} />
          <MuiSkeleton variant="text" width="90%" height={20} sx={{ mb: 0.5 }} />
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

// Home Page Skeleton
export const HomePageSkeleton = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box sx={{ mb: 4 }}>
        <MuiSkeleton variant="text" width="70%" height={48} sx={{ mb: 2 }} />
        <MuiSkeleton variant="text" width="50%" height={24} sx={{ mb: 1 }} />
        <MuiSkeleton variant="text" width="40%" height={24} />
      </Box>
      
      {/* Stats Section */}
      <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} sx={{ p: 2, flex: 1 }}>
            <MuiSkeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
            <MuiSkeleton variant="text" width="40%" height={20} />
          </Card>
        ))}
      </Box>
      
      {/* Recent Questions */}
      <Box>
        <MuiSkeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
        <QuestionsListSkeleton count={3} />
      </Box>
    </Box>
  );
};

export default {
  QuestionSkeleton,
  QuestionsListSkeleton,
  UserProfileSkeleton,
  FormSkeleton,
  AnswerSkeleton,
  HomePageSkeleton,
}; 