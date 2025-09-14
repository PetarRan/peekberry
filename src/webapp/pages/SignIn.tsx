import { SignInButton, useUser } from '@clerk/clerk-react';
import { Box, Typography, Button, useTheme } from '@mui/material';

export default function SignIn() {
  const { isSignedIn } = useUser();
  const theme = useTheme();

  // If already signed in, redirect to dashboard
  if (isSignedIn) {
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        px: 3,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: theme.palette.primary.dark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
        }}
      >
        <img 
          src="../assets/logo.avif" 
          alt="Peekberry Logo" 
          style={{ width: 48, height: 48 }}
        />
      </Box>

      {/* Title */}
      <Typography 
        variant="h3" 
        sx={{ 
          fontWeight: 600, 
          color: 'text.primary', 
          mb: 1,
          textAlign: 'center'
        }}
      >
        Peekberry
      </Typography>

      {/* Subtitle */}
      <Typography 
        variant="h6" 
        sx={{ 
          color: 'text.secondary', 
          mb: 6,
          textAlign: 'center',
          fontWeight: 400
        }}
      >
        AI-Powered DOM Editor
      </Typography>

      {/* Sign In Button */}
      <SignInButton mode="modal">
        <Button
          variant="contained"
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 500,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          }}
        >
          Sign In
        </Button>
      </SignInButton>
    </Box>
  );
}
