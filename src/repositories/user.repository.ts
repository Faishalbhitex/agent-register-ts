import { pool } from "../config/db.js";
import { User, CreateUserDTO } from "../models/user.model.js";
import { QueryResult } from "pg";

export class UserRepository {
  async create(createData: CreateUserDTO & { password_hash: string }): Promise<User> {
    const query = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING *
    `;
    const values = [createData.username, createData.email, createData.password_hash];

    const result: QueryResult<User> = await pool.query(query, values);
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE email = $1`;
    const result: QueryResult<User> = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE username = $1`;
    const result: QueryResult<User> = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  async findById(id: number): Promise<User | null> {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result: QueryResult<User> = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

export const userRepository = new UserRepository();
