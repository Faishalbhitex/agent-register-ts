import { A2AClient } from "@a2a-js/sdk/client";
import {
  AGENT_CARD_PATH,
  AgentCard,
} from "@a2a-js/sdk";

export class A2AService {
  async fetchAgentUrl(agentUrl: string) {
    try {
      const baseUrl = agentUrl.endsWith('/') ? agentUrl : `${agentUrl}/`;
      const agentCardUrl = `${baseUrl}${AGENT_CARD_PATH}`;

      const client = await A2AClient.fromCardUrl(agentCardUrl);
      const card: AgentCard = await client.getAgentCard();

      return {
        name: card.name,
        description: card.description,
        url: card.url
      };
    } catch (err) {
      throw new Error(`Failed to fetch agent card from ${agentUrl}: ${err}`);
    }
  }
}

export const a2aService = new A2AService();
