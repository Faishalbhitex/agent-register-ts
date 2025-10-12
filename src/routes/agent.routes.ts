import { Router } from 'express';
import { agentController } from '../controllers/agent.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes 
router.get('/', (req, res, next) => agentController.getAll(req, res, next));
router.get('/:id', (req, res, next) => agentController.getById(req, res, next));

// Protected routes
router.post('/', authMiddleware, (req, res, next) => agentController.register(req, res, next));
router.put('/:id', authMiddleware, (req, res, next) => agentController.update(req, res, next));
router.delete('/:id', authMiddleware, (req, res, next) => agentController.delete(req, res, next));

export default router;


