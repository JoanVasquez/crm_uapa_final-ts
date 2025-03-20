import { CustomError } from './CustomError';

/**
 * 🛢️ DatabaseError - Custom error for database-related failures.
 * - Extends `CustomError` with a default HTTP status of `500 Internal Server Error`.
 */
export class DatabaseError extends CustomError {
  /**
   * 🛑 Constructor for DatabaseError.
   * @param message - The error message (default: "Database error").
   * @param details - Additional error details (optional).
   */
  constructor(message = 'Database error', details?: unknown) {
    super(message, 500, details);
  }
}
