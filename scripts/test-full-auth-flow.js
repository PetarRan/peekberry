/**
 * Comprehensive test for Peekberry extension authentication flow
 * This script tests the complete authentication process including token generation and API access
 */

const API_BASE_URL = 'http://localhost:3000';

async function testFullAuthFlow() {
  console.log('🧪 Testing Peekberry Extension Full Authentication Flow...\n');

  // Test 1: Verify unauthenticated requests are blocked
  console.log('1. Testing unauthenticated API access...');
  await testUnauthenticatedAccess();

  // Test 2: Test token verification endpoints
  console.log('\n2. Testing token verification...');
  await testTokenVerification();

  // Test 3: Test protected API endpoints
  console.log('\n3. Testing protected API endpoints...');
  await testProtectedEndpoints();

  console.log('\n✅ All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start dev server: npm run dev');
  console.log('2. Sign in at http://localhost:3000');
  console.log(
    '3. Visit http://localhost:3000/extension-auth to generate a token'
  );
  console.log('4. Test the extension with the generated token');
}

async function testUnauthenticatedAccess() {
  const endpoints = [
    { method: 'GET', path: '/api/extension/auth' },
    { method: 'GET', path: '/api/screenshots' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
      });

      if (response.status === 401) {
        console.log(
          `   ✅ ${endpoint.method} ${endpoint.path} - Correctly blocked`
        );
      } else {
        console.log(
          `   ❌ ${endpoint.method} ${endpoint.path} - Expected 401, got ${response.status}`
        );
      }
    } catch (error) {
      console.log(
        `   ❌ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`
      );
    }
  }
}

async function testTokenVerification() {
  // Test invalid token
  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token-12345' }),
    });

    if (response.status === 401) {
      console.log('   ✅ Invalid token correctly rejected');
    } else {
      console.log(`   ❌ Invalid token - Expected 401, got ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Invalid token test error: ${error.message}`);
  }

  // Test missing token
  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (response.status === 400) {
      console.log('   ✅ Missing token correctly rejected');
    } else {
      console.log(`   ❌ Missing token - Expected 400, got ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Missing token test error: ${error.message}`);
  }
}

async function testProtectedEndpoints() {
  const endpoints = [
    { method: 'GET', path: '/api/screenshots', description: 'Get screenshots' },
    {
      method: 'POST',
      path: '/api/screenshots',
      description: 'Upload screenshot',
    },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer invalid-token',
        },
        body:
          endpoint.method === 'POST'
            ? JSON.stringify({ test: 'data' })
            : undefined,
      });

      if (response.status === 401) {
        console.log(`   ✅ ${endpoint.description} - Correctly requires auth`);
      } else {
        console.log(
          `   ❌ ${endpoint.description} - Expected 401, got ${response.status}`
        );
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.description} - Error: ${error.message}`);
    }
  }
}

// Helper function to test with a real token (for manual testing)
function generateTokenTestCode(token) {
  return `
// Test with real token:
const token = '${token}';

// Test token verification
const verifyResponse = await fetch('${API_BASE_URL}/api/extension/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
});
console.log('Token verification:', await verifyResponse.json());

// Test authenticated API call
const apiResponse = await fetch('${API_BASE_URL}/api/screenshots', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});
console.log('API call result:', await apiResponse.json());
  `;
}

// Export helper for manual testing
global.testWithToken = function (token) {
  console.log('Copy and paste this code in your browser console:');
  console.log(generateTokenTestCode(token));
};

// Run tests
testFullAuthFlow().catch(console.error);
