import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";
import { ResponseUtil } from "../utils/response.js";
import { BadRequestError } from "../utils/errors.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password_hash } = req.body;

      if (!username || !email || !password_hash) {
        throw new BadRequestError('Username, email and password are required');
      }

      const { user, tokens } = await authService.register({ username, email, password_hash });

      ResponseUtil.created(res, { user, tokens }, 'User registered successfully');
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new BadRequestError('Email and password are required');
      }

      const { user, tokens } = await authService.login({ email, password });

      ResponseUtil.success(res, { user, tokens }, 'Login successfully');
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new BadRequestError('User not authenticated');
      }

      ResponseUtil.success(res, req.user, 'User info retrived');
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }
      const { accessToken } = await authService.refreshAccessToken(refreshToken);

      ResponseUtil.success(res, { accessToken }, 'Refresh token successfully');
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        throw new BadRequestError('Refresh token is required');
      }
      await authService.logout(refreshToken);

      ResponseUtil.noContent(res);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
