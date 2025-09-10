'use client';

import { Grid, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { Edit, CameraAlt, TrendingUp, PhotoLibrary } from '@mui/icons-material';
import { StatsCard } from './StatsCard';
import { useStats } from '@/hooks/useStats';
import { StatsLoading } from './LoadingState';

export function StatsDashboard() {
  const { data: stats, isLoading, error } = useStats();

  if (isLoading) {
    return <StatsLoading />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load statistics. Please try again later.
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ fontWeight: 'bold', color: 'text.primary', mb: 3 }}
      >
        Your Activity
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Edits This Month"
            value={stats.editsThisMonth}
            icon={<Edit />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Screenshots This Month"
            value={stats.screenshotsThisMonth}
            icon={<CameraAlt />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Edits"
            value={stats.totalEdits}
            icon={<TrendingUp />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Screenshots"
            value={stats.totalScreenshots}
            icon={<PhotoLibrary />}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
