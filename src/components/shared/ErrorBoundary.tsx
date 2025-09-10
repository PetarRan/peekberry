'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Alert, AlertTitle } from '@mui/material';
import { RefreshRounded, BugReportRounded } from '@mui/icons-material';
import {
  logError,
  createPeekberryError,
  ERROR_CODES,
} from '../../utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire application
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    const peekberryError = createPeekberryError(
      error,
      ERROR_CODES.UNKNOWN_ERROR,
      {
        component: 'ErrorBoundary',
        operation: 'componentDidCatch',
        url: window.location.href,
        timestamp: new Date(),
      }
    );

    logError(peekberryError);

    // Update state with error info
    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: 3,
            textAlign: 'center',
          }}
        >
          <Alert
            severity="error"
            sx={{
              maxWidth: 600,
              width: '100%',
              mb: 3,
            }}
          >
            <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BugReportRounded />
              Something went wrong
            </AlertTitle>
            <Typography variant="body2" sx={{ mb: 2 }}>
              An unexpected error occurred. This has been logged and we'll look
              into it.
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </Typography>
              </Box>
            )}
          </Alert>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <Button
              variant="contained"
              startIcon={<RefreshRounded />}
              onClick={this.handleRetry}
              sx={{ minWidth: 120 }}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={this.handleReload}
              sx={{ minWidth: 120 }}
            >
              Reload Page
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Async error handler for use in event handlers and async operations
 */
export function handleAsyncError(error: Error, context?: string) {
  const peekberryError = createPeekberryError(
    error,
    ERROR_CODES.UNKNOWN_ERROR,
    {
      component: context || 'AsyncOperation',
      operation: 'handleAsyncError',
      url: window.location.href,
      timestamp: new Date(),
    }
  );

  logError(peekberryError);

  // In a real application, you might want to show a toast notification here
  console.error('Async error handled:', error);
}
