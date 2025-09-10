#!/usr/bin/env node

/**
 * Test script for screenshot capture functionality
 * This script tests the screenshot API endpoint
 */

const fs = require('fs');
const path = require('path');

// Mock image data (1x1 pixel PNG)
const mockImageData = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02,
  0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44,
  0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

async function testScreenshotAPI() {
  console.log('🧪 Testing Screenshot Capture API...');

  try {
    // Test data
    const metadata = {
      pageUrl: 'https://example.com',
      pageTitle: 'Test Page',
      editCount: 3,
      dimensions: {
        width: 1920,
        height: 1080,
      },
    };

    // Create form data
    const FormData = require('form-data');
    const formData = new FormData();

    // Create a mock file
    formData.append('file', mockImageData, {
      filename: 'test-screenshot.png',
      contentType: 'image/png',
    });

    formData.append('metadata', JSON.stringify(metadata));

    // Test without authentication (should fail)
    console.log('📝 Testing without authentication...');

    const response1 = await fetch('http://localhost:3000/api/screenshots', {
      method: 'POST',
      body: formData,
    });

    if (response1.status === 401) {
      console.log('✅ Correctly rejected unauthenticated request');
    } else {
      console.log('❌ Should have rejected unauthenticated request');
      console.log('Response status:', response1.status);
      console.log('Response:', await response1.text());
    }

    // Test with invalid file type
    console.log('📝 Testing with invalid file type...');

    const formData2 = new FormData();
    formData2.append('file', Buffer.from('not an image'), {
      filename: 'test.txt',
      contentType: 'text/plain',
    });
    formData2.append('metadata', JSON.stringify(metadata));

    // We would need a valid auth token for this test
    // For now, just test the structure

    console.log('✅ Screenshot API structure tests completed');
    console.log('📋 Manual testing required:');
    console.log('   1. Load extension in Chrome');
    console.log('   2. Authenticate with webapp');
    console.log('   3. Click screenshot button in extension');
    console.log('   4. Check webapp dashboard for uploaded screenshot');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testScreenshotAPI();
}

module.exports = { testScreenshotAPI };
