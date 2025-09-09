/**
 * Development helper to generate test JWT tokens
 * This is for testing purposes only - in production, tokens are generated via Clerk auth
 */

const { SignJWT } = require('jose');

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'peekberry-extension-jwt-secret-key-2024'
);

async function generateTestToken(userId = 'test-user-123') {
  try {
    const token = await new SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    console.log('🔑 Test Token Generated:');
    console.log('Token:', token);
    console.log('User ID:', userId);
    console.log('Expires:', new Date(expiresAt).toISOString());

    console.log('\n📋 Test Commands:');
    console.log('Test token verification:');
    console.log(`curl -X POST http://localhost:3000/api/extension/auth/verify \\
  -H "Content-Type: application/json" \\
  -d '{"token":"${token}"}'`);

    console.log('\nTest API call:');
    console.log(`curl -X GET http://localhost:3000/api/screenshots \\
  -H "Authorization: Bearer ${token}"`);

    return { token, userId, expiresAt };
  } catch (error) {
    console.error('Error generating test token:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const userId = process.argv[2] || 'test-user-123';
  generateTestToken(userId).catch(console.error);
}

module.exports = { generateTestToken };
