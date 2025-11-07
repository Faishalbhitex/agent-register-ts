import { Response, Request, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { UnauthorizedError } from '../utils/errors.js';
import { userRepository } from '../repositories/user.repository.js';

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const isBlackListed = await authService.isBlackListed(token);
    if (isBlackListed) {
      throw new UnauthorizedError("Token has been revoked. Please log in again.");
    }

    const decoded = authService.verifyToken(token) as unknown as { id: number; type?: string };
    if (!decoded || decoded.type !== 'access') {
      throw new UnauthorizedError(`Invalid token type`);
    }
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
