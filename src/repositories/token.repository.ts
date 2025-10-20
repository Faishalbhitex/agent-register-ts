import { pool } from "../config/db.js";
import { QueryResult } from "pg";

export interface RefreshToken {
  id: number;
  token: string;
  user_id: number;
  expires_at: Date;
  created_at: Date;
}

export interface CreateRefreshTokenDTO {
  token: string;
  user_id: number;
  expires_at: Date;
}

export class TokenRepository {
  async create(tokenData: CreateRefreshTokenDTO): Promise<RefreshToken> {
    const query = `
      INSERT INTO refresh_tokens (token, user_id, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [tokenData.token, tokenData.user_id, tokenData.expires_at];
    const result: QueryResult<RefreshToken> = await pool.query(query, values);
    return result.rows[0];
  }

  async findByToken(token: string): Promise<RefreshToken | null> {
    const query = `SELECT * FROM refresh_tokens WHERE token = $1`;
    const result: QueryResult<RefreshToken> = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  async deleteByToken(token: string): Promise<boolean> {
    const query = `DELETE FROM refresh_tokens WHERE token = $1`;
    const result = await pool.query(query, [token]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const tokenRepository = new TokenRepository();
