import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";
import { userRepository } from "../repositories/user.repository.js";

export const optionalAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);

      if (decoded) {
        const user = await userRepository.findById(decoded.id);
        if (user) {
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          };
        }
      }
    }
  } catch (err) {
    // Ignore error (example token expired) and continue pretend user as guest
    console.log('Optional auth failed, procesing as guest.');
  }

  // Always continue to the next handler
  next();
}
