import { pool } from "../config/db.js";

/**
 *  Delted expired refresh token from database
 *  @returns Number of tokens deleted 
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const query = `DELETE FROM refresh_tokens WHERE expires_at < NOW()`;
    const result = await pool.query(query);
    const deletedCount = result.rowCount || 0;

    if (deletedCount > 0) {
      console.log('Cleaned up ${deletedCount} expired refresh token(s)');
    }

    return deletedCount;
  } catch (err) {
    console.error('Error cleaning up expired tokens:', err);
    return 0;
  }
}

/**
 * Limit numbers of refresh tokens per user (keep only N most recent)
 * @param userId - User Id 
 * @param keepCount - Number of tokens to keep (default: 5)
 * @returns Number of tokens deleted
 */
export async function limitUserTokens(userId: number, keepCount: number = 5): Promise<number> {
  try {
    const query = `
      DELETE FROM refresh_tokens
      WHERE user_id = $1
      AND id NOT IN (
        SELECT id FROM refresh_tokens
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
    )`;
    const result = await pool.query(query, [userId, keepCount]);
    const deletedCount = result.rowCount || 0;

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old token(s) for user ${userId}`);
    }

    return deletedCount;
  } catch (err) {
    console.error(`Error limiting tokens for user ${userId}:`, err);
    return 0;
  }
}

/**
 * Get token statistics
 */
export async function getTokenStats(): Promise<{
  total: number;
  expired: number;
  active: number;
  byUser: Array<{ user_id: number; token_count: number }>;
}> {
  try {
    // Total tokens 
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM refresh_tokens');
    const total = parseInt(totalResult.rows[0].count);

    // Expired tokens 
    const expiredResult = await pool.query('SELECT COUNT(*) as count FROM refresh_tokens WHERE expires_at < NOW()');
    const expired = parseInt(expiredResult.rows[0].count);

    // Active tokens 
    const active = total - expired;

    // Token by user 
    const byUserResult = await pool.query(`
      SELECT user_id, COUNT(*) as token_count
      FROM refresh_tokens
      GROUP BY user_id
      ORDER BY token_count DESC
    `);
    const byUser = byUserResult.rows.map(row => ({
      user_id: row.user_id,
      token_count: parseInt(row.token_count),
    }));

    return { total, expired, active, byUser };
  } catch (err) {
    console.error('Error getting token stats:', err);
    return { total: 0, expired: 0, active: 0, byUser: [] };
  }
}
