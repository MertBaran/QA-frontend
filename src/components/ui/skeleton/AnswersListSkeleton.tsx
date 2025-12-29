import { Box } from '@mui/material';
import { AnswerCardSkeleton } from './AnswerCardSkeleton';

export const AnswersListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <AnswerCardSkeleton key={index} isAlternateTexture={index % 2 === 1} />
      ))}
    </Box>
  );
};

