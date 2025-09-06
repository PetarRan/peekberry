import ReactDOM from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Box, Typography, CircularProgress } from "@mui/material";
import theme from "../../theme/theme";
import { AuthProvider, useAuth } from "../../shared/contexts/AuthContext";
import { AuthFlow } from "./AuthFlow";
import {
  handleOAuthCallback,
  isOAuthCallback,
} from "../../shared/utils/oauth-handler";
import { useEffect, useState } from "react";

function PopupContent() {
  const { user, loading: authLoading } = useAuth();
  const [oauthProcessing, setOauthProcessing] = useState(false);

  useEffect(() => {
    // Handle OAuth callback if present
    const handleCallback = async () => {
      if (isOAuthCallback()) {
        setOauthProcessing(true);
        const success = await handleOAuthCallback();
        setOauthProcessing(false);

        if (success) {
          // Clear the URL parameters to clean up the UI
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }
      }
    };

    handleCallback();
  }, []);

  // Notify content scripts when user becomes authenticated and close popup
  useEffect(() => {
    if (user) {
      // Send message to all tabs to activate extension
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs
              .sendMessage(tab.id, {
                type: "USER_AUTHENTICATED",
                user: user,
              })
              .catch(() => {
                // Ignore errors for tabs that don't have content script
              });
          }
        });
      });

      // Close popup immediately after sending messages
      setTimeout(() => {
        window.close();
      }, 100);
    }
  }, [user]);

  if (authLoading || oauthProcessing) {
    return (
      <Box
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <CircularProgress size={24} />
        {oauthProcessing && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Completing sign in...
          </Typography>
        )}
      </Box>
    );
  }

  if (!user) {
    return <AuthFlow />;
  }

  // User is authenticated - show brief loading then close
  return (
    <Box sx={{ p: 2, width: 200, textAlign: "center" }}>
      <CircularProgress size={24} />
      <Typography variant="body2" sx={{ mt: 1 }}>
        Activating...
      </Typography>
    </Box>
  );
}

function Popup() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <PopupContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Popup />);
