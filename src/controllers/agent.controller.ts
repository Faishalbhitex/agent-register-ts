import { Request, Response, NextFunction } from "express";
import { agentService } from "../services/agent.service.js";
import { ResponseUtil } from "../utils/response.js";
import { BadRequestError } from "../utils/errors.js";

export class AgentController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.body;

      if (!url) {
        throw new BadRequestError('Agent URL is required');
      }

      const userId = req.user?.id;
      const agent = await agentService.registerFromUrl(url, userId);

      ResponseUtil.created(res, agent, 'Agent registered successfully');
    } catch (err) {
      next(err);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const agents = await agentService.findAll();

      ResponseUtil.success(res, agents, 'Agents retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new BadRequestError('Invalid agent ID');
      }

      const agent = await agentService.getById(id);

      ResponseUtil.success(res, agent, 'Agent retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const { name, description, url } = req.body;

      if (isNaN(id)) {
        throw new BadRequestError('Invalid agent ID');
      }

      const agent = await agentService.update(id, { name, description, url });

      ResponseUtil.success(res, agent, 'Agent updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        throw new BadRequestError('Invalid agent ID');
      }

      await agentService.delete(id);
      ResponseUtil.noContent(res);
    } catch (err) {
      next(err);
    }
  }
}

export const agentController = new AgentController();
