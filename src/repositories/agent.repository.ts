import { pool } from "../config/db.js";
import { Agent, CreateAgentDTO, UpdateAgentDTO } from "../models/agent.model.js";
import { QueryResult } from "pg";

export class AgentRepository {
  async create(agentData: CreateAgentDTO, userId?: number): Promise<Agent> {
    const query = `
    INSERT INTO agents (name, description, url, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
    const values = [
      agentData.name,
      agentData.description,
      agentData.url,
      userId || null
    ];

    const result: QueryResult<Agent> = await pool.query(query, values);
    return result.rows[0];
  }

  async findAll(): Promise<Agent[]> {
    const query = `SELECT * FROM agents ORDER BY created_at DESC`;
    const result: QueryResult<Agent> = await pool.query(query);
    return result.rows;
  }

  async findAllByUser(userId: number): Promise<Agent[]> {
    const query = `
      SELECT * FROM agents
      WHERE user_id = $1 or user_id IS NULL 
      ORDER BY created_at DESC
    `;
    const result: QueryResult<Agent> = await pool.query(query, [userId]);
    return result.rows;
  }

  async findAllPublic(): Promise<Agent[]> {
    const query = `
      SELECT * FROM agents
      WHERE user_id IS NULL
      ORDER BY created_at DESC
    `;
    const result: QueryResult<Agent> = await pool.query(query);
    return result.rows;
  }

  async findById(id: number): Promise<Agent | null> {
    const query = `SELECT * FROM agents WHERE id = $1`;
    const result: QueryResult<Agent> = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByUrl(url: string): Promise<Agent | null> {
    const query = `SELECT * FROM agents WHERE url = $1`;
    const result: QueryResult<Agent> = await pool.query(query, [url]);
    return result.rows[0] || null;
  }

  async findByName(name: string): Promise<Agent | null> {
    const query = `SELECT * FROM agents WHERE name = $1`;
    const result: QueryResult<Agent> = await pool.query(query, [name]);
    return result.rows[0] || null;
  }

  async update(id: number, agentData: UpdateAgentDTO): Promise<Agent | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (agentData.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(agentData.name);
      paramCount++;
    }

    if (agentData.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(agentData.description);
      paramCount++;
    }

    if (agentData.url !== undefined) {
      fields.push(`url = $${paramCount}`);
      values.push(agentData.url);
      paramCount++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
    UPDATE agents
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
    `;

    const result: QueryResult<Agent> = await pool.query(query, values);
    return result.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const query = `DELETE FROM agents WHERE id = $1 RETURNING id`;
    const result: QueryResult<Agent> = await pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const agentRepository = new AgentRepository();
