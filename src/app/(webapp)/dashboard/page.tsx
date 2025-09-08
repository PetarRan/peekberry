import { Box, Typography, Container } from '@mui/material';
import { auth, currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = auth();
  const user = await currentUser();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome back, {user?.firstName || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Here's your Peekberry dashboard where you can view your editing
          statistics and manage your screenshots.
        </Typography>

        {/* Placeholder for stats and screenshots - will be implemented in later tasks */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Coming Soon:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Editing statistics and activity counters
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Screenshot gallery and management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Account settings and preferences
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
