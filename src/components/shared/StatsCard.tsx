'use client';

import { ReactNode } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

interface StatsCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  return (
    <Card
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.300',
        boxShadow:
          '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              component="div"
              sx={{ fontWeight: 'bold', color: 'text.primary' }}
            >
              {value.toLocaleString()}
            </Typography>
          </Box>
          <Box
            sx={{
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              fontSize: '2rem',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
