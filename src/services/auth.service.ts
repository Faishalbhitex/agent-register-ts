import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { CreateUserDTO, LoginDTO, UserResponse } from "../models/user.model.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";

export class AuthService {
  async register(userdata: CreateUserDTO): Promise<{ user: UserResponse; token: string }> {
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
    const token = this.generateToken(user.id, user.email);

    // Return user withoutt passwordrd 
    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    };

    return { user: userResponse, token: token };
  }

  async login(loginData: LoginDTO): Promise<{ user: UserResponse; token: string }> {
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

    const token = this.generateToken(user.id, user.email);

    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at,
    };

    return { user: userResponse, token: token };
  }

  generateToken(userId: number, email: string): string {
    const payload = { id: userId, email: email };
    const secret = env.jwt.secret;
    const options = {
      expiresIn: env.jwt.expiresIn as any
    };
    return jwt.sign(payload, secret, options);
  }

  verifyToken(token: string): { id: number; email: string } {
    try {
      const decoded = jwt.verify(token, env.jwt.secret) as { id: number; email: string };
      return decoded;
    } catch (err) {
      throw new UnauthorizedError("Invalid or expired token");
    }
  }
}

export const authService = new AuthService();
