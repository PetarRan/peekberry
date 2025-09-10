'use client';

import { ReactNode } from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import { ConnectionStatus } from '@/components/shared/ConnectionStatus';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Extension Status Header */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Extension Status
        </Typography>
        <ConnectionStatus showDetails />
      </Box>

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
