import { Box } from '@mui/material';
import { QuestionsListSkeleton } from './QuestionsListSkeleton';
import { AnswersListSkeleton } from './AnswersListSkeleton';

export const SearchPageSkeleton = () => {
  return (
    <Box>
      {/* Questions Skeleton */}
      <Box sx={{ mb: 4 }}>
        <QuestionsListSkeleton count={5} />
      </Box>
      {/* Answers Skeleton */}
      <Box>
        <AnswersListSkeleton count={5} />
      </Box>
    </Box>
  );
};

