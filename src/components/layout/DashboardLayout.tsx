'use client';

import { ReactNode } from 'react';
import { Box, Container, Grid } from '@mui/material';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Main Content Area */}
        <Grid item xs={12} lg={sidebar ? 8 : 12}>
          <Box sx={{ bgcolor: 'background.default' }}>{children}</Box>
        </Grid>

        {/* Right Sidebar */}
        {sidebar && (
          <Grid item xs={12} lg={4}>
            <Box
              sx={{
                bgcolor: 'grey.100', // Secondary background
                borderRadius: 2,
                p: 3,
                height: 'fit-content',
                position: 'sticky',
                top: 24,
              }}
            >
              {sidebar}
            </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}
