/**
 * Test script for extension authentication endpoints
 * Run with: node scripts/test-extension-auth.js
 */

const API_BASE_URL = 'http://localhost:3000';

async function testAuthEndpoints() {
  console.log('Testing Peekberry Extension Authentication Endpoints...\n');

  // Test 1: Try to get auth token without authentication (should fail)
  console.log('1. Testing GET /api/extension/auth without authentication...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/auth`);
    const result = await response.json();

    if (response.status === 401) {
      console.log('✅ Correctly returned 401 Unauthorized');
    } else {
      console.log('❌ Expected 401 but got:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Try to verify invalid token
  console.log(
    '\n2. Testing POST /api/extension/auth/verify with invalid token...'
  );
  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: 'invalid-token' }),
    });
    const result = await response.json();

    if (response.status === 401) {
      console.log('✅ Correctly returned 401 for invalid token');
    } else {
      console.log('❌ Expected 401 but got:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Try to verify without token
  console.log('\n3. Testing POST /api/extension/auth/verify without token...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/extension/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const result = await response.json();

    if (response.status === 400) {
      console.log('✅ Correctly returned 400 for missing token');
    } else {
      console.log('❌ Expected 400 but got:', response.status);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n✅ Basic endpoint tests completed!');
  console.log('\nTo test with authentication:');
  console.log('1. Start the Next.js dev server: npm run dev');
  console.log('2. Sign in to the webapp at http://localhost:3000');
  console.log('3. Visit http://localhost:3000/extension-auth');
  console.log('4. Load the extension from src/app/(extension)/dist folder');
}

// Run tests
testAuthEndpoints().catch(console.error);
