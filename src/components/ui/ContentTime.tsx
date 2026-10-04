import React, { useState } from 'react';
import { Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { formatContentAge, formatExactDateTime } from '../../utils/contentAge';

interface ContentTimeProps {
  value?: string | null;
  currentLanguage: string;
  variant?: 'body2' | 'caption';
  sx?: SxProps<Theme>;
}

const ContentTime: React.FC<ContentTimeProps> = ({
  value,
  currentLanguage,
  variant = 'body2',
  sx,
}) => {
  const [exact, setExact] = useState(false);
  if (!value) return null;

  const label = exact
    ? formatExactDateTime(value, currentLanguage)
    : formatContentAge(value, currentLanguage);

  return (
    <Typography
      component="button"
      type="button"
      variant={variant}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setExact((open) => !open);
      }}
      sx={[
        {
          p: 0,
          m: 0,
          border: 0,
          bgcolor: 'transparent',
          color: 'text.secondary',
          cursor: 'pointer',
          font: 'inherit',
          lineHeight: 'inherit',
          textAlign: 'inherit',
          verticalAlign: 'baseline',
          '&:hover': { textDecoration: 'underline' },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {label}
    </Typography>
  );
};

export default ContentTime;
