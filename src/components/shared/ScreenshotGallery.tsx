'use client';

import { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search, Add } from '@mui/icons-material';
import { ScreenshotCard } from './ScreenshotCard';
import { useScreenshots } from '@/hooks/useScreenshots';
import { ScreenshotGalleryLoading } from './LoadingState';

interface ScreenshotGalleryProps {
  onCreateScreenshot?: () => void;
}

export function ScreenshotGallery({
  onCreateScreenshot,
}: ScreenshotGalleryProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 12; // 12 screenshots per page for a nice grid

  const { data, isLoading, error } = useScreenshots(page, limit);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const filteredScreenshots =
    data?.screenshots.filter(
      (screenshot) =>
        screenshot.metadata.pageTitle
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        screenshot.metadata.pageUrl
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    ) || [];

  if (isLoading) {
    return <ScreenshotGalleryLoading />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load screenshots. Please try again later.
      </Alert>
    );
  }

  if (!data || data.screenshots.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.300',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          No screenshots yet.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Your recently generated screenshots will appear here.
        </Typography>
        {onCreateScreenshot && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateScreenshot}
            sx={{ mt: 2 }}
          >
            Take a screenshot
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filter Bar */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search screenshots..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        {onCreateScreenshot && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateScreenshot}
          >
            Take Screenshot
          </Button>
        )}
      </Box>

      {/* Screenshots Grid */}
      <Grid container spacing={3}>
        {filteredScreenshots.map((screenshot) => (
          <Grid item xs={12} sm={6} md={4} key={screenshot.id}>
            <ScreenshotCard screenshot={screenshot} />
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={data.pagination.totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Results Info */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredScreenshots.length} of {data.pagination.total}{' '}
          screenshots
        </Typography>
      </Box>
    </Box>
  );
}
