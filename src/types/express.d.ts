import { User, Role } from '../models/user.model.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: Role;
      }
    }
  }
}
