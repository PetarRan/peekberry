import { SignIn } from '@clerk/nextjs';
import { Box, Container, Typography, Paper } from '@mui/material';

export default function SignInPage() {
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
            Welcome to Peekberry
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Sign in to start editing websites with natural language commands
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <SignIn
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
            signUpUrl="/sign-up"
          />
        </Box>
      </Paper>
    </Container>
  );
}
