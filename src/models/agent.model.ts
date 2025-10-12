
export interface Agent {
  id: number;
  name: string;
  description: string | null;
  url: string;
  user_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAgentDTO {
  name: string;
  description?: string;
  url: string
}

export interface UpdateAgentDTO {
  name?: string;
  description?: string;
  url?: string
}

export interface AgentResponse {
  id: number;
  name: string;
  description: string | null;
  url: string;
  created_at: Date;
  updated_at: Date;
}
