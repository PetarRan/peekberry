import { ReactNode } from 'react';
import { Box } from '@mui/material';
import { AppNavigation } from '@/components/layout/AppNavigation';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

interface WebappLayoutProps {
  children: ReactNode;
}

export default function WebappLayout({ children }: WebappLayoutProps) {
  return (
    <ErrorBoundary>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppNavigation />
        <Box
          component="main"
          sx={{
            minHeight: 'calc(100vh - 80px)', // Subtract header height
            bgcolor: 'background.default',
          }}
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </Box>
      </Box>
    </ErrorBoundary>
  );
}
