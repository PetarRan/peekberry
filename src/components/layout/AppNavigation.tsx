'use client';

import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';
import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/nextjs';
import Link from 'next/link';

export function AppNavigation() {
  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
          }}
        >
          Peekberry
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SignedIn>
            <Button color="inherit" component={Link} href="/dashboard">
              Dashboard
            </Button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: {
                    width: '32px',
                    height: '32px',
                  },
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="redirect">
              <Button color="inherit">Sign In</Button>
            </SignInButton>
            <Button
              variant="outlined"
              color="inherit"
              component={Link}
              href="/sign-up"
            >
              Sign Up
            </Button>
          </SignedOut>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
