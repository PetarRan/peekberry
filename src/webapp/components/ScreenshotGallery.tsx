import { Box, Typography, useTheme } from '@mui/material';

interface Screenshot {
  id: string;
  image_url: string;
  created_at: string;
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
}

export default function ScreenshotGallery({ screenshots }: ScreenshotGalleryProps) {
  const theme = useTheme();
  
  if (screenshots.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 300,
          backgroundColor: theme.palette.background.default,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No screenshots yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Screenshots
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {screenshots.map((screenshot) => (
          <Box
            key={screenshot.id}
            sx={{
              flex: '1 1 300px',
              maxWidth: '300px',
            }}
          >
            <Box
              component="img"
              src={screenshot.image_url}
              alt="Screenshot"
              sx={{
                width: '100%',
                height: 200,
                objectFit: 'cover',
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
