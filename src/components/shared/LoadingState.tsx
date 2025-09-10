'use client';

import { ReactNode } from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Skeleton,
  Card,
  CardContent,
  Grid,
} from '@mui/material';

interface LoadingStateProps {
  type?: 'spinner' | 'linear' | 'skeleton' | 'card-skeleton';
  message?: string;
  progress?: number;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  children?: ReactNode;
}

export function LoadingState({
  type = 'spinner',
  message,
  progress,
  size = 'medium',
  fullScreen = false,
  children,
}: LoadingStateProps) {
  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return { size: 24, fontSize: '0.875rem' };
      case 'large':
        return { size: 64, fontSize: '1.25rem' };
      default:
        return { size: 40, fontSize: '1rem' };
    }
  };

  const { size: spinnerSize, fontSize } = getSizeProps();

  const renderSpinner = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: fullScreen ? 8 : 4,
      }}
    >
      <CircularProgress
        size={spinnerSize}
        variant={progress !== undefined ? 'determinate' : 'indeterminate'}
        value={progress}
      />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize, textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
      {progress !== undefined && (
        <Typography variant="caption" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );

  const renderLinear = () => (
    <Box sx={{ width: '100%', p: fullScreen ? 8 : 2 }}>
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, fontSize, textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
      <LinearProgress
        variant={progress !== undefined ? 'determinate' : 'indeterminate'}
        value={progress}
        sx={{ height: size === 'large' ? 8 : size === 'small' ? 4 : 6 }}
      />
      {progress !== undefined && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, display: 'block', textAlign: 'center' }}
        >
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );

  const renderSkeleton = () => (
    <Box sx={{ p: fullScreen ? 8 : 2 }}>
      <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="70%" height={20} sx={{ mb: 2 }} />
      <Skeleton
        variant="rectangular"
        width="100%"
        height={200}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Skeleton variant="rectangular" width="48%" height={100} />
        <Skeleton variant="rectangular" width="48%" height={100} />
      </Box>
    </Box>
  );

  const renderCardSkeleton = () => (
    <Grid container spacing={3} sx={{ p: fullScreen ? 8 : 2 }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
            <Skeleton variant="rectangular" height={200} />
            <CardContent>
              <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" height={16} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderContent = () => {
    switch (type) {
      case 'linear':
        return renderLinear();
      case 'skeleton':
        return renderSkeleton();
      case 'card-skeleton':
        return renderCardSkeleton();
      default:
        return renderSpinner();
    }
  };

  const containerProps = fullScreen
    ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'background.default',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    : {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };

  return <Box sx={containerProps}>{children || renderContent()}</Box>;
}

// Specialized loading components
export function ScreenshotGalleryLoading() {
  return <LoadingState type="card-skeleton" message="Loading screenshots..." />;
}

export function StatsLoading() {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="40%" height={32} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export function DashboardLoading() {
  return (
    <Box>
      <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 4 }} />

      <StatsLoading />

      <Box sx={{ mt: 4 }}>
        <Skeleton variant="text" width="30%" height={32} sx={{ mb: 3 }} />
        <ScreenshotGalleryLoading />
      </Box>
    </Box>
  );
}

// Hook for managing loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [progress, setProgress] = useState<number | undefined>();
  const [message, setMessage] = useState<string | undefined>();

  const startLoading = (loadingMessage?: string) => {
    setIsLoading(true);
    setMessage(loadingMessage);
    setProgress(undefined);
  };

  const updateProgress = (newProgress: number, progressMessage?: string) => {
    setProgress(newProgress);
    if (progressMessage) {
      setMessage(progressMessage);
    }
  };

  const stopLoading = () => {
    setIsLoading(false);
    setProgress(undefined);
    setMessage(undefined);
  };

  return {
    isLoading,
    progress,
    message,
    startLoading,
    updateProgress,
    stopLoading,
  };
}

// Import useState for the hook
import { useState } from 'react';
