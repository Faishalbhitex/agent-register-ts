import { Router } from 'express';
import authRouter from '../routes/auth.routes.js';
import agentRouter from '../routes/agent.routes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/agents', agentRouter);

export default router;
