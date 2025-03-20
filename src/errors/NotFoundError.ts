import { CustomError } from './CustomError';

/**
 * 🔍 NotFoundError - Custom error for handling resource not found scenarios.
 * - Extends `CustomError` with a default HTTP status of `404 Not Found`.
 */
export class NotFoundError extends CustomError {
  /**
   * 🛑 Constructor for NotFoundError.
   * @param resource - The name of the resource that was not found (default: "Resource").
   */
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}
