import { CustomError } from './CustomError';

/**
 * 🔐 AuthError - Custom error for authentication failures.
 * - Extends `CustomError` with a default HTTP status of `401 Unauthorized`.
 */
export class AuthError extends CustomError {
  /**
   * 🚫 Constructor for AuthError.
   * @param message - The error message (default: "Authentication error").
   */
  constructor(message = 'Authentication error') {
    super(message, 401);
  }
}
