#!/usr/bin/env -S deno run --allow-env --allow-net

/**
 * Manual cleanup script for expired OTP codes
 * This can be run periodically or as needed
 */

import { OTPDatabaseService } from "./utils/database.ts";

async function main() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    Deno.exit(1);
  }

  console.log('🧹 Starting cleanup of expired OTP codes...');

  try {
    const dbService = new OTPDatabaseService({
      supabaseUrl,
      supabaseServiceKey
    });

    // Get stats before cleanup
    const statsBefore = await dbService.getOTPStats();
    console.log(`📊 Before cleanup: ${statsBefore.totalActive} active, ${statsBefore.expiredCount} expired, ${statsBefore.verifiedCount} verified`);

    // Perform cleanup
    const deletedCount = await dbService.cleanupExpiredCodes();
    console.log(`🗑️  Deleted ${deletedCount} expired OTP codes`);

    // Get stats after cleanup
    const statsAfter = await dbService.getOTPStats();
    console.log(`📊 After cleanup: ${statsAfter.totalActive} active, ${statsAfter.expiredCount} expired, ${statsAfter.verifiedCount} verified`);

    console.log('✅ Cleanup completed successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}