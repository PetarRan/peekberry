import { NextRequest } from 'next/server';

export interface TokenData {
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Extract and validate auth token from request headers
 * This utility can be used in API routes that need to authenticate extension requests
 */
export function validateAuthToken(request: NextRequest): {
  valid: boolean;
  tokenData?: TokenData;
  error?: string;
} {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Decode the token
      const tokenData: TokenData = JSON.parse(
        Buffer.from(token, 'base64').toString()
      );

      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        return { valid: false, error: 'Token expired' };
      }

      // Validate token structure
      if (
        !tokenData.userId ||
        !tokenData.email ||
        !tokenData.createdAt ||
        !tokenData.expiresAt
      ) {
        return { valid: false, error: 'Invalid token structure' };
      }

      return { valid: true, tokenData };
    } catch (decodeError) {
      return { valid: false, error: 'Invalid token format' };
    }
  } catch (error) {
    console.error('Error validating auth token:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Middleware function to protect API routes
 * Returns the token data if valid, or throws an error if invalid
 */
export function requireAuth(request: NextRequest): TokenData {
  const validation = validateAuthToken(request);

  if (!validation.valid || !validation.tokenData) {
    throw new Error(validation.error || 'Authentication required');
  }

  return validation.tokenData;
}

/**
 * Create an auth token for a user
 * This is used by the token generation endpoint
 */
export function createAuthToken(userId: string, email: string): string {
  const tokenData: TokenData = {
    userId,
    email,
    createdAt: Date.now(),
    // Token expires in 30 days
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };

  // For MVP, we'll use base64 encoding
  // In production, use proper JWT signing with a secret key
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}
