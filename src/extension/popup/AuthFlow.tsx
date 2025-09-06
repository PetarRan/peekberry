import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import { useAuth } from "../../shared/contexts/AuthContext";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export const AuthFlow: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, loading, error, setDevUser } =
    useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setLocalError(null);
  };

  const handleSkipAuth = () => {
    // Create a fake user for development
    const fakeUser = {
      id: "dev-user-123",
      email: "dev@peekberry.com",
      authenticated: true,
      sessionToken: "dev-token-123",
    };

    // Directly set the auth state (DEV ONLY)
    setDevUser(fakeUser);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    try {
      if (tabValue === 0) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setLocalError(null);
        // Show success message for sign up
        setLocalError("Check your email for verification link");
      }
    } catch (err) {
      // Error is handled by the context
    }
  };

  const displayError = localError || error;

  return (
    <Paper elevation={0} sx={{ width: 320, p: 2 }}>
      <Typography variant="h6" component="h1" gutterBottom align="center">
        Welcome to Peekberry
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={signInWithGoogle}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={16} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M17.64 9.20455C17.64 8.56641 17.5827 7.95273 17.4764 7.36364H9V10.845H14.0436C13.84 11.97 13.2545 12.923 12.3636 13.5614V15.8191H15.1091C16.6545 14.4227 17.64 12.0318 17.64 9.20455Z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18C11.43 18 13.4673 17.1941 15.1091 15.8191L12.3636 13.5614C11.5909 14.1014 10.5945 14.4205 9 14.4205C6.65909 14.4205 4.67273 12.837 3.96409 10.71L1.05682 12.9418C2.61818 16.0232 5.50909 18 9 18Z"
                  fill="#34A853"
                />
                <path
                  d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29L1.05682 5.05818C0.384091 6.40227 0 7.92045 0 9.5C0 11.0795 0.384091 12.5977 1.05682 13.9418L3.96409 10.71Z"
                  fill="#FBBC04"
                />
                <path
                  d="M9 3.57955C10.6364 3.57955 12.1036 4.15364 13.2545 5.24091L15.7091 2.78636C13.4627 0.699545 10.4291 -0.5 9 -0.5C5.50909 -0.5 2.61818 1.47682 1.05682 4.55818L3.96409 6.79C4.67273 4.663 6.65909 3.57955 9 3.57955Z"
                  fill="#EA4335"
                />
              </svg>
            )
          }
          sx={{
            backgroundColor: "#fff",
            color: "#1f1f1f",
            border: "1px solid #dadce0",
            "&:hover": {
              backgroundColor: "#f8f9fa",
              boxShadow:
                "0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)",
            },
            textTransform: "none",
            fontWeight: 500,
          }}
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={handleSkipAuth}
          disabled={loading}
          sx={{
            mt: 2,
            color: "#6366f1",
            borderColor: "#6366f1",
            "&:hover": {
              backgroundColor: "rgba(99, 102, 241, 0.04)",
              borderColor: "#6366f1",
            },
            textTransform: "none",
          }}
        >
          Skip for Development
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
          <Box sx={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }} />
          <Typography variant="body2" sx={{ mx: 2, color: "text.secondary" }}>
            or
          </Typography>
          <Box sx={{ flex: 1, height: "1px", backgroundColor: "#e0e0e0" }} />
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label="Sign In" />
        <Tab label="Sign Up" />
      </Tabs>

      <form onSubmit={handleSubmit}>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
              helperText="Minimum 6 characters"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : null}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </Box>
        </TabPanel>
      </form>

      {displayError && (
        <Alert
          severity={
            localError === "Check your email for verification link"
              ? "success"
              : "error"
          }
          sx={{ mt: 2 }}
        >
          {displayError}
        </Alert>
      )}
    </Paper>
  );
};
