import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserProfile } from '@clerk/nextjs';

export default async function AccountPage() {
  const { userId } = await auth();
  const user = await currentUser();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 'bold' }}
        >
          Account Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Manage your account settings and preferences
        </Typography>

        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent sx={{ p: 0 }}>
            <UserProfile
              appearance={{
                elements: {
                  rootBox: {
                    width: '100%',
                  },
                  card: {
                    border: 'none',
                    boxShadow: 'none',
                  },
                },
              }}
            />
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
