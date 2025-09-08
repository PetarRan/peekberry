import { Box, Typography, Button, Container } from '@mui/material';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 4,
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          Welcome to Peekberry
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 600 }}>
          Edit any website with natural language commands. Install our Chrome
          extension and start making visual changes instantly.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <SignedIn>
            <Button
              variant="contained"
              size="large"
              component={Link}
              href="/dashboard"
            >
              Go to Dashboard
            </Button>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="redirect" redirectUrl="/dashboard">
              <Button variant="contained" size="large">
                Get Started
              </Button>
            </SignInButton>
            <Button
              variant="outlined"
              size="large"
              component={Link}
              href="/sign-up"
            >
              Sign Up
            </Button>
          </SignedOut>

          <Button variant="outlined" size="large">
            Install Extension
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
