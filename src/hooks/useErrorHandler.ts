import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
  PeekberryError,
  ERROR_CODES,
  logError,
  createPeekberryError,
  getUserFriendlyMessage,
  retryWithBackoff,
} from '../utils/errorHandling';

/**
 * Custom hook for handling errors consistently across the webapp
 */
export function useErrorHandler() {
  const router = useRouter();
  const { signOut } = useAuth();

  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback(
    (error: Error | PeekberryError) => {
      const peekberryError =
        error instanceof PeekberryError
          ? error
          : createPeekberryError(error, ERROR_CODES.AUTH_TOKEN_EXPIRED, {
              component: 'ErrorHandler',
              operation: 'handleAuthError',
              url: window.location.href,
              timestamp: new Date(),
            });

      logError(peekberryError);

      // Sign out and redirect to login
      signOut();
      router.push('/sign-in');
    },
    [signOut, router]
  );

  /**
   * Handle API errors with appropriate user feedback
   */
  const handleApiError = useCallback(
    (error: Error | PeekberryError, context?: string) => {
      const peekberryError =
        error instanceof PeekberryError
          ? error
          : createPeekberryError(error, ERROR_CODES.UNKNOWN_ERROR, {
              component: 'ErrorHandler',
              operation: context || 'handleApiError',
              url: window.location.href,
              timestamp: new Date(),
            });

      logError(peekberryError);

      // Handle specific error types
      if (
        peekberryError.code === ERROR_CODES.AUTH_TOKEN_EXPIRED ||
        peekberryError.code === ERROR_CODES.AUTH_TOKEN_INVALID ||
        peekberryError.code === ERROR_CODES.AUTH_REQUIRED
      ) {
        handleAuthError(peekberryError);
        return;
      }

      // Return user-friendly message for display
      return getUserFriendlyMessage(peekberryError);
    },
    [handleAuthError]
  );

  /**
   * Handle network errors with retry logic
   */
  const handleNetworkError = useCallback(
    async <T>(
      operation: () => Promise<T>,
      context?: string,
      maxRetries: number = 3
    ): Promise<T> => {
      try {
        return await retryWithBackoff(
          operation,
          {
            maxAttempts: maxRetries,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
          },
          {
            component: 'ErrorHandler',
            operation: context || 'handleNetworkError',
            url: window.location.href,
            timestamp: new Date(),
          }
        );
      } catch (error) {
        const errorMessage = handleApiError(error as Error, context);
        throw new Error(errorMessage);
      }
    },
    [handleApiError]
  );

  /**
   * Safe async operation wrapper
   */
  const safeAsync = useCallback(
    async <T>(
      operation: () => Promise<T>,
      fallback?: T,
      context?: string
    ): Promise<T | undefined> => {
      try {
        return await operation();
      } catch (error) {
        const errorMessage = handleApiError(error as Error, context);

        if (fallback !== undefined) {
          return fallback;
        }

        // Re-throw with user-friendly message
        throw new Error(errorMessage);
      }
    },
    [handleApiError]
  );

  /**
   * Handle form submission errors
   */
  const handleFormError = useCallback(
    (error: Error | PeekberryError, formName?: string) => {
      const context = `form_${formName || 'unknown'}`;
      return handleApiError(error, context);
    },
    [handleApiError]
  );

  /**
   * Handle file upload errors
   */
  const handleUploadError = useCallback((error: Error | PeekberryError) => {
    const peekberryError =
      error instanceof PeekberryError
        ? error
        : createPeekberryError(error, ERROR_CODES.UNKNOWN_ERROR, {
            component: 'ErrorHandler',
            operation: 'handleUploadError',
            url: window.location.href,
            timestamp: new Date(),
          });

    logError(peekberryError);

    // Check for specific upload error types
    if (
      peekberryError.message.includes('size') ||
      peekberryError.message.includes('large')
    ) {
      return 'File is too large. Please choose a smaller file.';
    }

    if (
      peekberryError.message.includes('type') ||
      peekberryError.message.includes('format')
    ) {
      return 'File type not supported. Please choose a different file.';
    }

    return getUserFriendlyMessage(peekberryError);
  }, []);

  /**
   * Create error context for logging
   */
  const createErrorContext = useCallback(
    (operation: string, component?: string) => ({
      component: component || 'Unknown',
      operation,
      url: window.location.href,
      timestamp: new Date(),
    }),
    []
  );

  return {
    handleAuthError,
    handleApiError,
    handleNetworkError,
    handleFormError,
    handleUploadError,
    safeAsync,
    createErrorContext,
  };
}
