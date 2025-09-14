import { Box, Typography, useTheme } from '@mui/material';

interface WelcomeMessageProps {
  userName: string;
}

export default function WelcomeMessage({ userName }: WelcomeMessageProps) {
  const theme = useTheme();
  
  const messages = [
    "Ready to edit the web with AI? Select any element on any staging website and describe your changes",
    "Time to get ready for that demo! Better spin up peekberry and make those changes asap!",
    "Tired of pinging devs to change the size of the button? Here at peekberry we get the struggle."
  ];

  // Use modulo of today's day to cycle through messages
  const todaysMessage = messages[new Date().getDate() % 3];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
        Welcome back, {userName}!
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {todaysMessage}
      </Typography>
    </Box>
  );
}
