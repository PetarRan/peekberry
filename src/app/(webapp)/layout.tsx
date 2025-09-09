import { ReactNode } from 'react';
import { Box } from '@mui/material';
import { AppNavigation } from '@/components/layout/AppNavigation';

interface WebappLayoutProps {
  children: ReactNode;
}

export default function WebappLayout({ children }: WebappLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppNavigation />
      <Box
        component="main"
        sx={{
          minHeight: 'calc(100vh - 80px)', // Subtract header height
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
