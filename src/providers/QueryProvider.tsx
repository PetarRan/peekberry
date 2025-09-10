'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { isRetryableError } from '../utils/errorHandling';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: (failureCount, error: any) => {
              // Don't retry auth errors
              if (error?.status === 401) {
                return false;
              }

              // Don't retry client errors (4xx)
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }

              // Check if error is retryable
              if (error instanceof Error && !isRetryableError(error)) {
                return false;
              }

              // Retry up to 3 times for retryable errors
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: (failureCount, error: any) => {
              // Don't retry mutations by default for safety
              // Only retry network errors
              if (error instanceof Error && error.name === 'NetworkError') {
                return failureCount < 2;
              }
              return false;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
