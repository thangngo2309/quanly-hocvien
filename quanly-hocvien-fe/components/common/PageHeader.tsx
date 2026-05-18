'use client';

import { Box, Stack, Typography } from '@mui/material';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <Box mb={2}>
      <Typography variant="h5" fontWeight={700}>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {description}
        </Typography>
      )}

      {actions && (
        <Stack
          direction="row"
          spacing={1}
          mt={2}
          flexWrap="wrap"
          useFlexGap
        >
          {actions}
        </Stack>
      )}
    </Box>
  );
}