import { SignUp } from '@clerk/nextjs';
import { Box, Container, Typography, Paper } from '@mui/material';

export default function SignUpPage() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Join Peekberry
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Create your account to start editing websites with AI-powered
            commands
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <SignUp
            appearance={{
              elements: {
                rootBox: {
                  width: '100%',
                },
                card: {
                  boxShadow: 'none',
                  border: 'none',
                },
              },
            }}
            redirectUrl="/dashboard"
            signInUrl="/sign-in"
          />
        </Box>
      </Paper>
    </Container>
  );
}
