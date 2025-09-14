import { Box, Typography, useTheme, Modal, IconButton, Backdrop, Skeleton } from '@mui/material';
import { Close as CloseIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useState } from 'react';

interface Screenshot {
  id: string;
  image_url: string;
  created_at: string;
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  loading?: boolean;
}

export default function ScreenshotGallery({ screenshots, loading = false }: ScreenshotGalleryProps) {
  const theme = useTheme();
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScreenshotClick = (screenshot: Screenshot) => {
    setSelectedScreenshot(screenshot);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedScreenshot(null);
  };

  const formatRelativeTime = (dateString: string): string => {
    const now = new Date();
    // Parse the UTC date string and convert to local time
    const utcDate = new Date(dateString + 'Z'); // Ensure it's treated as UTC
    
    const diffInSeconds = Math.floor((now.getTime() - utcDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just-now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}-minutes-ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}-hours-ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}-days-ago`;
    }
  };

  const handleDownload = async () => {
    if (!selectedScreenshot) return;
    
    try {
      const response = await fetch(selectedScreenshot.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const relativeTime = formatRelativeTime(selectedScreenshot.created_at);
      // Convert UTC to local date for filename
      const utcDate = new Date(selectedScreenshot.created_at + 'Z');
      const localDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
      const timestamp = localDate.toISOString().split('T')[0];
      link.download = `screenshot-${timestamp}-${relativeTime}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading screenshot:', error);
    }
  };
  
  if (loading) {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Screenshots
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                flex: '1 1 300px',
                maxWidth: '300px',
              }}
            >
              <Skeleton
                variant="rectangular"
                width="100%"
                height={200}
                sx={{
                  borderRadius: 1,
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

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
              onClick={() => handleScreenshotClick(screenshot)}
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
      
      {/* Screenshot Viewer Modal */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 300,
          sx: { 
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
            outline: 'none',
          }}
        >
          {/* Action Buttons */}
          <Box
            sx={{
              position: 'absolute',
              top: 24,
              right: 24,
              display: 'flex',
              gap: 1,
              zIndex: 1,
            }}
          >
            {/* Download Button */}
            <IconButton
              onClick={handleDownload}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                width: 48,
                height: 48,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <DownloadIcon sx={{ fontSize: 24 }} />
            </IconButton>
            
            {/* Close Button */}
            <IconButton
              onClick={handleCloseModal}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
                width: 48,
                height: 48,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <CloseIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Box>
          
          {/* Image Container */}
          {selectedScreenshot && (
            <Box
              component="img"
              src={selectedScreenshot.image_url}
              alt="Screenshot"
              sx={{
                maxWidth: '95vw',
                maxHeight: '95vh',
                objectFit: 'contain',
                borderRadius: 0,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.3s ease-in-out',
                transform: isModalOpen ? 'scale(1)' : 'scale(0.9)',
              }}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
}
