import cron from 'node-cron';
import { cleanupExpiredTokens, getTokenStats } from './tokenCleanup.js';

/**
 *  Start automatic token cleanup scheduler
 */
export function startTokenCleanupScheduler() {
  // Run every dayy at 2 AM 
  cron.schedule('0 2 * * *', async () => {
    console.log('Running scheduled token cleanup..');
    const deletedCount = await cleanupExpiredTokens();
    console.log(`Scheduled cleanup completed. Deleted ${deletedCount} expired token(s)`);
  });

  // Run every hour (optional - for high-traffic apps)
  // cron.schedule('0 * * * *', async () => {
  //   await cleanupExpiredTokens();
  // });

  console.log('Token cleanup scheduler started (runs daily at 2 AM)');
}

/**
 *  Log token statistics periodically (optional monitoring)
 */
export function startTokenStatsLogger() {
  // Log stats every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    const stats = await getTokenStats();
    console.log('Token Statistics:', {
      total: stats.total,
      active: stats.active,
      expired: stats.expired,
      users: stats.byUser.length
    });
  });

  console.log('Token stats logger started (runs every 12 hours )');
}
