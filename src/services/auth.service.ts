import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { tokenRepository } from "../repositories/token.repository.js";
import { CreateUserDTO, LoginDTO, UserResponse, Role } from "../models/user.model.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";
import { limitUserTokens } from "../utils/tokenCleanup.js";
import ms from 'ms';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(userdata: CreateUserDTO): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    const existingEmail = await userRepository.findByEmail(userdata.email);
    if (existingEmail) {
      throw new ConflictError("Email already registered");
    }

    const existingUsername = await userRepository.findByUsername(userdata.username);
    if (existingUsername) {
      throw new ConflictError("Username already taken");
    }

    // Hash password
    const password_hash = await bcrypt.hash(userdata.password_hash, 10);

    // Create Userr 
    const user = await userRepository.create({
      username: userdata.username,
      email: userdata.email,
      password_hash,
    });

    // Generate Token 
    const tokens = await this.generateAuthTokens({ id: user.id, email: user.email, role: user.role as Role });

    // Return user withoutt passwordrd 
    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role as Role,
      created_at: user.created_at
    };

    return { user: userResponse, tokens: tokens };
  }

  async login(loginData: LoginDTO): Promise<{ user: UserResponse; tokens: AuthTokens }> {
    // Find by email
    const user = await userRepository.findByEmail(loginData.email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Verivy passwordd
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Cleanup: keep onlu 5 most recent tokens per user 
    await limitUserTokens(user.id, 5);

    const tokens = await this.generateAuthTokens({ id: user.id, email: user.email, role: user.role as Role });

    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role as Role,
      created_at: user.created_at,
    };

    return { user: userResponse, tokens: tokens };
  }

  async refreshAccessToken(oldRefreshToken: string): Promise<{ accessToken: string }> {
    // Check token if ain database  
    const tokenInDb = await tokenRepository.findByToken(oldRefreshToken);
    if (!tokenInDb) {
      throw new UnauthorizedError("Invalid refresh token. Please log in again.");
    }

    // Verify token 
    try {
      const decoded = jwt.verify(oldRefreshToken, env.jwt.refreshSecret) as { id: number };

      const user = await userRepository.findById(decoded.id);
      if (!user) {
        throw new UnauthorizedError("User not found for this token.");
      }

      const accessToken = this.generateAccessToken(user.id, user.email);
      return { accessToken };

    } catch (err) {
      // If token not valid orr expired, r remove from DB 
      await tokenRepository.deleteByToken(oldRefreshToken);
      throw new UnauthorizedError("Invalid or expired refresh token. Please log in again.");
    }
  }

  async logout(refreshToken: string): Promise<void> {
    const deleted = await tokenRepository.deleteByToken(refreshToken);
    if (!deleted) {
      console.warn(`Attempted to log out with a non-existent refresh token.`);
    }
  }

  verifyToken(token: string): { id: number; email: string; role: Role } {
    try {
      const decoded = jwt.verify(token, env.jwt.secret) as { id: number; email: string; role: Role };
      return decoded;
    } catch (err) {
      throw new UnauthorizedError("Invalid or expired access token");
    }
  }

  private generateAccessToken(userId: number, email: string, role: Role = 'user'): string {
    const payload = { id: userId, email: email, role: role, type: 'access' };
    const secret = env.jwt.secret;
    const signOptions = { expiresIn: env.jwt.expiresIn as any };
    return jwt.sign(payload, secret, signOptions);
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const payload = { id: userId, type: 'refresh' };
    const refreshSecret = env.jwt.refreshSecret;
    const signOptions = { expiresIn: env.jwt.refreshExpiresIn as any };
    const refreshToken = jwt.sign(payload, refreshSecret, signOptions);

    const expiresInMs = ms(env.jwt.refreshExpiresIn as any);
    const expiryDate = new Date(Date.now() + expiresInMs);
    await tokenRepository.create({ token: refreshToken, user_id: userId, expires_at: expiryDate });

    return refreshToken;
  }

  private async generateAuthTokens(user: { id: number; email: string, role: Role }): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.generateRefreshToken(user.id);
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }
}

export const authService = new AuthService();
