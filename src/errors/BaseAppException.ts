import { CustomError } from './CustomError';

/**
 * 🚨 BaseAppException - Generic exception for application-level errors.
 * - Extends `CustomError` to provide structured error handling.
 * - Supports additional error details.
 */
export class BaseAppException extends CustomError {
  /**
   * 🛑 Constructor for BaseAppException.
   * @param message - The error message (default: "Application error").
   * @param statusCode - The HTTP status code (default: `500` Internal Server Error).
   * @param details - Additional error details (optional).
   */
  constructor(
    message = 'Application error',
    statusCode = 500,
    details?: unknown,
  ) {
    super(message, statusCode, details);
  }
}
