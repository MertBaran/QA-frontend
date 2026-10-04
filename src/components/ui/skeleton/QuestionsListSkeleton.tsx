import { Box } from '@mui/material';
import { QuestionSkeleton } from './QuestionSkeleton';

export const QuestionsListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <QuestionSkeleton key={index} isAlternateTexture={index % 2 === 1} />
      ))}
    </Box>
  );
};

