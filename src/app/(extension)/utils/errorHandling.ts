/**
 * Simplified error handling utilities for Chrome extension
 * (Copied from src/utils/errorHandling.ts to avoid import issues)
 */

export interface ErrorContext {
  component: string;
  operation: string;
  userId?: string;
  url?: string;
  timestamp: Date;
}

export class PeekberryError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly isRetryable: boolean;

  constructor(
    message: string,
    code: string,
    context: ErrorContext,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'PeekberryError';
    this.code = code;
    this.context = context;
    this.isRetryable = isRetryable;
  }
}

export const ERROR_CODES = {
  // Authentication errors
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_SYNC_FAILED: 'AUTH_SYNC_FAILED',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_TIMEOUT: 'API_TIMEOUT',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_SERVER_ERROR: 'API_SERVER_ERROR',

  // DOM manipulation errors
  DOM_ELEMENT_NOT_FOUND: 'DOM_ELEMENT_NOT_FOUND',
  DOM_MUTATION_FAILED: 'DOM_MUTATION_FAILED',
  DOM_SELECTOR_INVALID: 'DOM_SELECTOR_INVALID',

  // AI processing errors
  AI_PROCESSING_FAILED: 'AI_PROCESSING_FAILED',
  AI_COMMAND_INVALID: 'AI_COMMAND_INVALID',
  AI_CONTEXT_MISSING: 'AI_CONTEXT_MISSING',

  // Screenshot errors
  SCREENSHOT_CAPTURE_FAILED: 'SCREENSHOT_CAPTURE_FAILED',
  SCREENSHOT_UPLOAD_FAILED: 'SCREENSHOT_UPLOAD_FAILED',
  SCREENSHOT_PERMISSION_DENIED: 'SCREENSHOT_PERMISSION_DENIED',

  // Extension errors
  EXTENSION_NOT_AVAILABLE: 'EXTENSION_NOT_AVAILABLE',
  CONTENT_SCRIPT_ERROR: 'CONTENT_SCRIPT_ERROR',
  BACKGROUND_SCRIPT_ERROR: 'BACKGROUND_SCRIPT_ERROR',

  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export function isRetryableError(error: Error | PeekberryError): boolean {
  if (error instanceof PeekberryError) {
    return error.isRetryable;
  }

  // Network errors are generally retryable
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return true;
  }

  // Timeout errors are retryable
  if (error.message.includes('timeout')) {
    return true;
  }

  // Rate limit errors are retryable with delay
  if (error.message.includes('rate limit')) {
    return true;
  }

  return false;
}

export function getUserFriendlyMessage(error: PeekberryError | Error): string {
  if (error instanceof PeekberryError) {
    switch (error.code) {
      case ERROR_CODES.AUTH_TOKEN_EXPIRED:
      case ERROR_CODES.AUTH_TOKEN_INVALID:
        return 'Your session has expired. Please sign in again.';

      case ERROR_CODES.AUTH_REQUIRED:
        return 'Please sign in to use Peekberry.';

      case ERROR_CODES.NETWORK_ERROR:
        return 'Connection error. Please check your internet connection.';

      case ERROR_CODES.API_TIMEOUT:
        return 'Request timed out. Please try again.';

      case ERROR_CODES.API_RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.';

      case ERROR_CODES.DOM_ELEMENT_NOT_FOUND:
        return 'Selected element is no longer available. Please select a new element.';

      case ERROR_CODES.DOM_MUTATION_FAILED:
        return 'Unable to apply changes to this element. Please try a different element.';

      case ERROR_CODES.AI_PROCESSING_FAILED:
        return 'Unable to process your command. Please try rephrasing it.';

      case ERROR_CODES.SCREENSHOT_CAPTURE_FAILED:
        return 'Unable to capture screenshot. Please try again.';

      case ERROR_CODES.SCREENSHOT_PERMISSION_DENIED:
        return 'Screenshot permission denied. Please allow screenshot access in your browser.';

      default:
        return 'Something went wrong. Please try again.';
    }
  }

  return 'An unexpected error occurred. Please try again.';
}

export function logError(
  error: Error | PeekberryError,
  context?: ErrorContext
): void {
  const logData = {
    message: error.message,
    name: error.name,
    timestamp: new Date().toISOString(),
    context:
      context || (error instanceof PeekberryError ? error.context : undefined),
    code: error instanceof PeekberryError ? error.code : undefined,
  };

  console.error('Peekberry Error:', logData);
}

export function createPeekberryError(
  error: Error,
  code: string,
  context: ErrorContext,
  isRetryable: boolean = false
): PeekberryError {
  return new PeekberryError(error.message, code, context, isRetryable);
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context?: ErrorContext
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt === config.maxAttempts) {
        break;
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      console.warn(
        `Retry attempt ${attempt}/${config.maxAttempts} after ${delay}ms`,
        {
          error: lastError.message,
          context,
        }
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    const peekberryError =
      error instanceof PeekberryError
        ? error
        : createPeekberryError(
            error as Error,
            ERROR_CODES.UNKNOWN_ERROR,
            context
          );

    logError(peekberryError);

    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    throw peekberryError;
  }
}
