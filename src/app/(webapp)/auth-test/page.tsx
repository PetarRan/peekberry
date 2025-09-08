'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert,
  TextField,
  Stack,
} from '@mui/material';
import { useUser } from '@clerk/nextjs';
import { authAPI } from '@/api/auth';

export default function AuthTestPage() {
  const { user, isLoaded } = useUser();
  const [token, setToken] = useState<string>('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [profileResult, setProfileResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGenerateToken = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await authAPI.generateAuthToken();
      setToken(result.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateToken = async () => {
    if (!token) {
      setError('Please generate a token first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await authAPI.validateToken(token);
      setValidationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate token');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateSession = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await authAPI.validateSession();
      setSessionResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to validate session'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGetProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await authAPI.getUserProfile();
      setProfileResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <Typography>Loading...</Typography>;
  }

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="warning">
            Please sign in to test the authentication endpoints.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Authentication API Test
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Test the authentication endpoints for the Chrome extension
          integration.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Generate Token */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              1. Generate Auth Token
            </Typography>
            <Button
              variant="contained"
              onClick={handleGenerateToken}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Generate Token
            </Button>
            {token && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Generated Token"
                value={token}
                InputProps={{ readOnly: true }}
              />
            )}
          </Paper>

          {/* Validate Token */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              2. Validate Token
            </Typography>
            <Button
              variant="contained"
              onClick={handleValidateToken}
              disabled={loading || !token}
              sx={{ mb: 2 }}
            >
              Validate Token
            </Button>
            {validationResult && (
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Validation Result"
                value={JSON.stringify(validationResult, null, 2)}
                InputProps={{ readOnly: true }}
              />
            )}
          </Paper>

          {/* Validate Session */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              3. Validate Session
            </Typography>
            <Button
              variant="contained"
              onClick={handleValidateSession}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Validate Session
            </Button>
            {sessionResult && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Session Result"
                value={JSON.stringify(sessionResult, null, 2)}
                InputProps={{ readOnly: true }}
              />
            )}
          </Paper>

          {/* Get Profile */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              4. Get User Profile
            </Typography>
            <Button
              variant="contained"
              onClick={handleGetProfile}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              Get Profile
            </Button>
            {profileResult && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Profile Result"
                value={JSON.stringify(profileResult, null, 2)}
                InputProps={{ readOnly: true }}
              />
            )}
          </Paper>
        </Stack>
      </Box>
    </Container>
  );
}
