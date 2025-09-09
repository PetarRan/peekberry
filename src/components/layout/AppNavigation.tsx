'use client';

import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';

export function AppNavigation() {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'grey.300',
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        {/* Left Side - Logo and Subtitle */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h5"
            component={Link}
            href="/"
            sx={{
              textDecoration: 'none',
              color: 'text.primary',
              fontWeight: 'bold',
              display: 'block',
              lineHeight: 1.2,
            }}
          >
            Peekberry
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.875rem',
              mt: 0.25,
            }}
          >
            AI-Powered DOM Editor
          </Typography>
        </Box>

        {/* Right Side - User Profile Area */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SignedIn>
            <Button
              color="inherit"
              component={Link}
              href="/dashboard"
              sx={{ color: 'text.primary' }}
            >
              Dashboard
            </Button>
            <Button
              color="inherit"
              component={Link}
              href="/account"
              sx={{ color: 'text.primary' }}
            >
              Account
            </Button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: {
                    width: '36px',
                    height: '36px',
                  },
                  userButtonPopoverCard: {
                    pointerEvents: 'initial',
                  },
                },
              }}
            />
          </SignedIn>

          <SignedOut>
            <SignInButton>
              <Button sx={{ color: 'text.primary' }}>Sign In</Button>
            </SignInButton>
            <Button
              variant="contained"
              component={Link}
              href="/sign-up"
              sx={{ ml: 1 }}
            >
              Sign Up
            </Button>
          </SignedOut>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
