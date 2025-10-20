import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';
import { agentRepository } from '../repositories/agent.repository.js';

/**
 * Middleeare Check if user is admin
 */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  next();
}

/**
 * Middleware: Check if user owns the agent or is admin 
 */
export const requireAgentOwnership = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const agentId = parseInt(req.params.id);

  if (isNaN(agentId)) {
    throw new ForbiddenError('Invalid agent ID');
  }

  const agent = await agentRepository.findById(agentId);
  if (!agent) {
    return next();
  }

  // Admin grant all access to all agent 
  if (req.user?.role === 'admin') {
    return next();
  }

  // Regular user can only access theoir on agent from url  they register 
  if (agent.user_id === req.user?.id) {
    return next();
  }

  // User doensn't own this agent 
  throw new ForbiddenError('You can only manage your own agents');
}
