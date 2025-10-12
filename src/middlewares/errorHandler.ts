import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { ResponseUtil } from "../utils/response.js";

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    ResponseUtil.error(res, err.message, err.statusCode);
    return;
  }

  console.log(`Unexpected error: ${err}`);

  ResponseUtil.error(res, 'Internal server error', 500);
}

export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtil.error(res, `Route ${req.originalUrl} not found`, 404);
}
