import { agentRepository } from "../repositories/agent.repository.js";
import { a2aService } from "./a2a.service.js";
import { CreateAgentDTO, UpdateAgentDTO, AgentResponse, Agent } from "../models/agent.model.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";

export class AgentService {
  async registerFromUrl(agentUrl: string, userId?: number): Promise<AgentResponse> {
    const cardData = await a2aService.fetchAgentUrl(agentUrl);

    const existingAgent = await agentRepository.findByUrl(cardData.url);
    if (existingAgent) {
      throw new ConflictError("Agent already registered with this URL");
    }

    const existingName = await agentRepository.findByName(cardData.name);
    if (existingName) {
      throw new ConflictError("Agent already registered with this name");
    }

    // create agent
    const agent = await agentRepository.create(cardData, userId);

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      url: agent.url,
      user_id: agent.user_id,
      created_at: agent.created_at,
      updated_at: agent.updated_at,
    }
  }

  async findAll(userId?: number, isAdmin?: boolean): Promise<AgentResponse[]> {
    let agents: Agent[] = [];

    if (isAdmin) {
      agents = await agentRepository.findAll();
    } else if (userId) {
      agents = await agentRepository.findAllByUser(userId);
    } else {
      agents = await agentRepository.findAllPublic();
    }

    return agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      url: agent.url,
      user_id: agent.user_id,
      created_at: agent.created_at,
      updated_at: agent.updated_at,
    }));
  }

  async getById(id: number): Promise<AgentResponse> {
    const agent = await agentRepository.findById(id);
    if (!agent) {
      throw new NotFoundError("Agent not found");
    }

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      url: agent.url,
      user_id: agent.user_id,
      created_at: agent.created_at,
      updated_at: agent.updated_at,
    }
  }

  async update(id: number, updateData: UpdateAgentDTO): Promise<AgentResponse> {
    const agent = await agentRepository.update(id, updateData);
    if (!agent) {
      throw new NotFoundError("Agent not found");
    }

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      url: agent.url,
      user_id: agent.user_id,
      created_at: agent.created_at,
      updated_at: agent.updated_at,
    }
  }

  async delete(id: number): Promise<void> {
    const deleted = await agentRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Agent not found");
    }
  }
}

export const agentService = new AgentService();
