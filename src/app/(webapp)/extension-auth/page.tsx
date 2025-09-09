'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

export default function ExtensionAuthPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [authStatus, setAuthStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Redirect to sign-in if not authenticated
      window.location.href =
        '/sign-in?redirect_url=' + encodeURIComponent('/extension-auth');
      return;
    }

    // User is signed in, generate token for extension
    generateExtensionToken();
  }, [isLoaded, isSignedIn]);

  const generateExtensionToken = async () => {
    try {
      const response = await fetch('/api/extension/auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate auth token');
      }

      const result = await response.json();

      if (result.success) {
        // Store token in localStorage for extension to pick up
        localStorage.setItem(
          'peekberry_extension_token',
          JSON.stringify(result.data)
        );

        // Also try to send directly to extension if it's listening
        try {
          // This will only work if the extension is installed and listening
          window.postMessage(
            {
              type: 'PEEKBERRY_AUTH_TOKEN',
              token: result.data.token,
              userId: result.data.userId,
              expiresAt: result.data.expiresAt,
            },
            '*'
          );

          // Also try to communicate with extension via chrome.runtime if available
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime
              .sendMessage({
                type: 'STORE_AUTH_TOKEN',
                payload: result.data,
              })
              .catch(() => {
                // Extension might not be listening, that's okay
              });
          }
        } catch (e) {
          // Extension might not be installed, that's okay
        }

        setAuthStatus('success');
      } else {
        throw new Error(result.error || 'Failed to generate token');
      }
    } catch (error) {
      console.error('Error generating extension token:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setAuthStatus('error');
    }
  };

  const handleRetry = () => {
    setAuthStatus('loading');
    setErrorMessage('');
    generateExtensionToken();
  };

  const handleOpenExtension = () => {
    // Close this tab since auth is complete
    window.close();
  };

  if (!isLoaded) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress />
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ backgroundColor: '#F8FAFC', padding: 3 }}
    >
      <Box
        sx={{
          backgroundColor: 'white',
          borderRadius: 2,
          padding: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            Peekberry Extension
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connecting your browser extension
          </Typography>
        </Box>

        {/* Status Content */}
        {authStatus === 'loading' && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <CircularProgress size={48} />
            <Typography variant="h6">Setting up authentication...</Typography>
            <Typography variant="body2" color="text.secondary">
              Generating secure token for your extension
            </Typography>
          </Box>
        )}

        {authStatus === 'success' && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />
            <Typography variant="h6" color="success.main">
              Authentication Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Your Peekberry extension is now connected to your account.
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>
                  Welcome,{' '}
                  {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
                </strong>
                <br />
                You can now use the Peekberry extension on any website.
              </Typography>
            </Alert>
            <Button
              variant="contained"
              onClick={handleOpenExtension}
              size="large"
            >
              Close & Use Extension
            </Button>
          </Box>
        )}

        {authStatus === 'error' && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
            <Typography variant="h6" color="error.main">
              Authentication Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
            <Button variant="contained" onClick={handleRetry} size="large">
              Try Again
            </Button>
          </Box>
        )}

        {/* Instructions */}
        <Box mt={4} p={2} sx={{ backgroundColor: '#F1F5F9', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Next steps:</strong>
            <br />
            1. Look for the Peekberry icon in your browser toolbar
            <br />
            2. Click any element on a webpage to start editing
            <br />
            3. Use natural language to describe your changes
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
