'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Chip,
  Tooltip,
  IconButton,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
} from '@mui/material';
import {
  Wifi,
  WifiOff,
  Warning,
  CheckCircle,
  Extension,
  Refresh,
  Info,
} from '@mui/icons-material';

interface ConnectionStatusProps {
  showDetails?: boolean;
  onRetryConnection?: () => void;
}

interface ExtensionStatus {
  isInstalled: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  version?: string;
  lastSync?: Date;
  features?: string[];
}

export function ConnectionStatus({
  showDetails = false,
  onRetryConnection,
}: ConnectionStatusProps) {
  const [status, setStatus] = useState<ExtensionStatus>({
    isInstalled: false,
    isConnected: false,
    isAuthenticated: false,
  });
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkExtensionStatus();

    // Check status every 30 seconds
    const interval = setInterval(checkExtensionStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkExtensionStatus = async () => {
    setIsChecking(true);

    try {
      // Check if extension is installed by looking for extension-specific elements
      const extensionElements = document.querySelectorAll(
        '[data-peekberry-element]'
      );
      const isInstalled = extensionElements.length > 0;

      // Try to communicate with extension if installed
      let isConnected = false;
      let isAuthenticated = false;
      let version: string | undefined;
      let features: string[] | undefined;

      if (isInstalled) {
        try {
          // Post message to extension
          window.postMessage(
            {
              type: 'PEEKBERRY_STATUS_CHECK',
              source: 'webapp',
            },
            '*'
          );

          // Listen for response
          const response = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error('Timeout')),
              3000
            );

            const handler = (event: MessageEvent) => {
              if (event.data?.type === 'PEEKBERRY_STATUS_RESPONSE') {
                clearTimeout(timeout);
                window.removeEventListener('message', handler);
                resolve(event.data);
              }
            };

            window.addEventListener('message', handler);
          });

          isConnected = response.connected || false;
          isAuthenticated = response.authenticated || false;
          version = response.version;
          features = response.features;
        } catch (error) {
          // Extension might be installed but not responding
          isConnected = false;
        }
      }

      setStatus({
        isInstalled,
        isConnected,
        isAuthenticated,
        version,
        lastSync: isConnected ? new Date() : undefined,
        features,
      });
    } catch (error) {
      console.error('Error checking extension status:', error);
      setStatus({
        isInstalled: false,
        isConnected: false,
        isAuthenticated: false,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetryConnection = () => {
    checkExtensionStatus();
    onRetryConnection?.();
  };

  const handleShowDetails = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseDetails = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (): 'success' | 'warning' | 'error' | 'default' => {
    if (!status.isInstalled) return 'error';
    if (!status.isConnected) return 'warning';
    if (!status.isAuthenticated) return 'warning';
    return 'success';
  };

  const getStatusIcon = () => {
    if (!status.isInstalled) return <Extension />;
    if (!status.isConnected) return <WifiOff />;
    if (!status.isAuthenticated) return <Warning />;
    return <CheckCircle />;
  };

  const getStatusText = (): string => {
    if (!status.isInstalled) return 'Extension Not Installed';
    if (!status.isConnected) return 'Extension Disconnected';
    if (!status.isAuthenticated) return 'Not Authenticated';
    return 'Connected';
  };

  const getStatusDescription = (): string => {
    if (!status.isInstalled) {
      return 'Install the Peekberry browser extension to start editing websites';
    }
    if (!status.isConnected) {
      return 'Extension is installed but not responding. Try refreshing the page.';
    }
    if (!status.isAuthenticated) {
      return 'Extension is connected but not authenticated. Sign in through the extension.';
    }
    return 'Extension is connected and ready to use';
  };

  const renderStatusChip = () => (
    <Tooltip title={getStatusDescription()}>
      <Chip
        icon={getStatusIcon()}
        label={getStatusText()}
        color={getStatusColor()}
        variant={status.isAuthenticated ? 'filled' : 'outlined'}
        onClick={showDetails ? handleShowDetails : undefined}
        clickable={showDetails}
        sx={{
          '& .MuiChip-icon': {
            fontSize: '1rem',
          },
        }}
      />
    </Tooltip>
  );

  const renderDetailsPopover = () => (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={handleCloseDetails}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 2, minWidth: 300, maxWidth: 400 }}>
        <Typography variant="h6" gutterBottom>
          Extension Status
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon>
              {status.isInstalled ? (
                <CheckCircle color="success" />
              ) : (
                <Warning color="error" />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Installation"
              secondary={status.isInstalled ? 'Installed' : 'Not installed'}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              {status.isConnected ? (
                <Wifi color="success" />
              ) : (
                <WifiOff color="error" />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Connection"
              secondary={status.isConnected ? 'Connected' : 'Disconnected'}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              {status.isAuthenticated ? (
                <CheckCircle color="success" />
              ) : (
                <Warning color="warning" />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Authentication"
              secondary={
                status.isAuthenticated ? 'Authenticated' : 'Not authenticated'
              }
            />
          </ListItem>

          {status.version && (
            <ListItem>
              <ListItemIcon>
                <Info />
              </ListItemIcon>
              <ListItemText primary="Version" secondary={status.version} />
            </ListItem>
          )}

          {status.lastSync && (
            <ListItem>
              <ListItemIcon>
                <Refresh />
              </ListItemIcon>
              <ListItemText
                primary="Last Sync"
                secondary={status.lastSync.toLocaleTimeString()}
              />
            </ListItem>
          )}
        </List>

        {status.features && status.features.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Supported Features
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {status.features.map((feature) => (
                <Chip
                  key={feature}
                  label={feature}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {!status.isInstalled && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Install the Peekberry extension from the Chrome Web Store to get
              started.
            </Typography>
          </Alert>
        )}

        {status.isInstalled && !status.isConnected && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Extension is installed but not responding. Try refreshing this
              page or restarting your browser.
            </Typography>
          </Alert>
        )}

        {status.isConnected && !status.isAuthenticated && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Click the Peekberry extension icon in your browser toolbar and
              sign in to continue.
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={handleRetryConnection}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Refresh Status'}
          </Button>

          {!status.isInstalled && (
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                // Open Chrome Web Store (this would be the actual extension URL)
                window.open('https://chrome.google.com/webstore', '_blank');
              }}
            >
              Install Extension
            </Button>
          )}
        </Box>
      </Box>
    </Popover>
  );

  if (!showDetails) {
    return renderStatusChip();
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {renderStatusChip()}
      <IconButton
        size="small"
        onClick={handleRetryConnection}
        disabled={isChecking}
        title="Refresh connection status"
      >
        <Refresh sx={{ fontSize: '1rem' }} />
      </IconButton>
      {renderDetailsPopover()}
    </Box>
  );
}
