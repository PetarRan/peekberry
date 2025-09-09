import { Box, Typography } from '@mui/material';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatsDashboard } from '@/components/shared/StatsDashboard';
import { ScreenshotGallery } from '@/components/shared/ScreenshotGallery';

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in');
  }

  // Placeholder sidebar content - will be implemented in later tasks
  const sidebarContent = (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        AI Prompt
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Coming soon: AI-powered editing interface
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 3 }}>
        Recent Changes
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Coming soon: Recent editing activity
      </Typography>
    </Box>
  );

  return (
    <DashboardLayout sidebar={sidebarContent}>
      <Box>
        {/* Main Heading */}
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold', color: 'text.primary' }}
        >
          DOM Screenshots
        </Typography>

        {/* Subtext */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Screenshots of your live website taken after applying changes
        </Typography>

        {/* User Statistics */}
        <StatsDashboard />

        {/* Screenshot Gallery */}
        <ScreenshotGallery />
      </Box>
    </DashboardLayout>
  );
}
