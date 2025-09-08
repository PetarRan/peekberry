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
      <Box component="main">{children}</Box>
    </Box>
  );
}
