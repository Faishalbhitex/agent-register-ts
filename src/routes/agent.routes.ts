import { Router } from 'express';
import { agentController } from '../controllers/agent.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireAgentOwnership } from '../middlewares/authorization.middleware.js';
import { optionalAuthMiddleware } from '../middlewares/optionalAuth.middleware.js';

const router = Router();

// Public routes 
router.get('/', optionalAuthMiddleware, (req, res, next) => agentController.getAll(req, res, next));
router.get('/:id', (req, res, next) => agentController.getById(req, res, next));

// Protected routes - any authenticated user can register 
router.post('/', authMiddleware, (req, res, next) => agentController.register(req, res, next));

// Protected routes - ownership c check for update/delted  
router.put('/:id', authMiddleware, requireAgentOwnership, (req, res, next) => agentController.update(req, res, next));
router.delete('/:id', authMiddleware, requireAgentOwnership, (req, res, next) => agentController.delete(req, res, next));

export default router;


