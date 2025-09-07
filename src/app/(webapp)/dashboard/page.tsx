import { Box, Typography, Container } from '@mui/material';

export default function DashboardPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your Peekberry dashboard. This is where you'll see your
          editing statistics and manage your screenshots.
        </Typography>
      </Box>
    </Container>
  );
}
