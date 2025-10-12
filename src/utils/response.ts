import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export class ResponseUtil {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): Response {
    const response: ApiResponse = {
      success: true,
      message,
      data
    };

    return res.status(statusCode).json(response);
  }

  static error<T>(res: Response, error: string, statusCode: number = 500, message?: string): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message: string = "Created successfully"): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
