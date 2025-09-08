#!/usr/bin/env node

/**
 * Database test script for Peekberry
 * This script tests the database connection and basic operations
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseConnection() {
  console.log('🧪 Testing Peekberry database connection...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1️⃣ Testing table existence...');

    const { data: screenshots, error: screenshotsError } = await supabase
      .from('screenshots')
      .select('count', { count: 'exact', head: true });

    if (screenshotsError) {
      console.log('   ❌ Screenshots table: Not accessible');
      console.log('      Error:', screenshotsError.message);
    } else {
      console.log('   ✅ Screenshots table: Accessible');
    }

    const { data: userStats, error: userStatsError } = await supabase
      .from('user_stats')
      .select('count', { count: 'exact', head: true });

    if (userStatsError) {
      console.log('   ❌ User stats table: Not accessible');
      console.log('      Error:', userStatsError.message);
    } else {
      console.log('   ✅ User stats table: Accessible');
    }

    // Test 2: Check storage bucket
    console.log('\n2️⃣ Testing storage bucket...');

    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log('   ❌ Storage buckets: Not accessible');
      console.log('      Error:', bucketsError.message);
    } else {
      const screenshotsBucket = buckets.find((b) => b.name === 'screenshots');
      if (screenshotsBucket) {
        console.log('   ✅ Screenshots bucket: Found');
        console.log(`      Public: ${screenshotsBucket.public}`);
      } else {
        console.log('   ❌ Screenshots bucket: Not found');
      }
    }

    // Test 3: Test RPC functions
    console.log('\n3️⃣ Testing RPC functions...');

    const testUserId = 'test_user_' + Date.now();

    try {
      const { data: editResult, error: editError } = await supabase.rpc(
        'increment_edit_count',
        { user_id: testUserId }
      );

      if (editError) {
        console.log('   ❌ increment_edit_count RPC: Failed');
        console.log('      Error:', editError.message);
      } else {
        console.log('   ✅ increment_edit_count RPC: Working');
      }
    } catch (error) {
      console.log('   ❌ increment_edit_count RPC: Failed');
      console.log('      Error:', error.message);
    }

    try {
      const { data: screenshotResult, error: screenshotError } =
        await supabase.rpc('increment_screenshot_count', {
          user_id: testUserId,
        });

      if (screenshotError) {
        console.log('   ❌ increment_screenshot_count RPC: Failed');
        console.log('      Error:', screenshotError.message);
      } else {
        console.log('   ✅ increment_screenshot_count RPC: Working');
      }
    } catch (error) {
      console.log('   ❌ increment_screenshot_count RPC: Failed');
      console.log('      Error:', error.message);
    }

    // Clean up test data
    await supabase.from('user_stats').delete().eq('clerk_user_id', testUserId);

    console.log('\n🎉 Database test completed!');
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

// Main execution
testDatabaseConnection().catch(console.error);
