import { CustomError } from './CustomError';

/**
 * 🔴 RedisError - Custom error for Redis-related failures.
 * - Extends `CustomError` with a default HTTP status of `500 Internal Server Error`.
 */
export class RedisError extends CustomError {
  /**
   * 🛑 Constructor for RedisError.
   * @param message - The error message (default: "Redis error").
   * @param details - Additional error details (optional).
   */
  constructor(message = 'Redis error', details?: unknown) {
    super(message, 500, details);
  }
}
