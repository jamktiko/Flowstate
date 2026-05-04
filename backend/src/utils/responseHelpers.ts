import { Response } from 'express';

/**
 * Sends a consistent success response across all API endpoints.
 * @param res - Express response object
 * @param data - The payload to return to the client (user, board, etc.)
 * @param statusCode - HTTP status code, defaults to 200
 */
export const sendSuccess = (res: Response, data: any, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

/**
 * Sends a consistent error response across all API endpoints.
 * @param res - Express response object
 * @param message - Human-readable error description, decided by the caller
 * @param statusCode - HTTP status code, defaults to 400
 */
export const sendError = (res: Response, message: string, statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message });
};
