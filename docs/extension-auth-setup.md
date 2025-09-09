# Peekberry Extension Authentication Setup

## Overview

The Peekberry Chrome extension uses JWT tokens for authentication with the Next.js webapp. This document outlines the complete authentication flow and available endpoints.

## Authentication Flow

1. **User signs in** to the webapp using Clerk authentication
2. **Token generation** happens when user visits `/extension-auth` page
3. **Token storage** in both localStorage and Chrome extension storage
4. **Token verification** for all API requests from the extension

## API Endpoints

### Extension Authentication

#### `GET /api/extension/auth`

Generates a JWT token for authenticated users.

**Authentication**: Requires Clerk session
**Response**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "userId": "user_123",
    "expiresAt": 1757543638543
  }
}
```

#### `POST /api/extension/auth/verify`

Verifies a JWT token and returns user information.

**Request Body**:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "valid": true,
    "userId": "user_123"
  }
}
```

### Protected API Endpoints

#### `GET /api/screenshots`

Retrieves user's screenshots.

**Authentication**: Bearer token required
**Headers**: `Authorization: Bearer <token>`

#### `POST /api/screenshots`

Uploads a new screenshot.

**Authentication**: Bearer token required
**Headers**: `Authorization: Bearer <token>`

## Environment Variables

Add to your `.env.local`:

```env
JWT_SECRET=peekberry-extension-jwt-secret-key-2024
```

## Extension Integration

The Chrome extension background script handles:

- Token storage in Chrome storage API
- Automatic token verification
- API request authentication
- Token expiration handling

### Key Methods in Background Script

- `getAuthStatus()` - Check if user is authenticated
- `storeAuthToken(tokenData)` - Store token from webapp
- `verifyTokenWithServer()` - Verify token with API
- `makeAPIRequest(requestData)` - Make authenticated API calls

## Testing

### Automated Tests

Run the test suite:

```bash
node scripts/test-extension-auth.js
node scripts/test-full-auth-flow.js
```

### Manual Testing

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Sign in at `http://localhost:3000`

3. Visit `http://localhost:3000/extension-auth` to generate a token

4. Use the generated token to test API endpoints

### Development Token Generation

For testing purposes, generate a test token:

```bash
node scripts/generate-test-token.js [user-id]
```

## Security Considerations

- JWT tokens expire after 24 hours
- All API endpoints verify token authenticity
- Tokens are stored securely in Chrome extension storage
- Invalid/expired tokens are automatically cleared

## Error Handling

- `401 Unauthorized` - Invalid or missing token
- `400 Bad Request` - Malformed request
- `500 Internal Server Error` - Server-side issues

The extension automatically handles token expiration and prompts for re-authentication when needed.

## Next Steps

1. Implement screenshot upload/download functionality
2. Add user statistics tracking
3. Implement AI processing endpoints
4. Add rate limiting for API endpoints
5. Set up production JWT secret management
