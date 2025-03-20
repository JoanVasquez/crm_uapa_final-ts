import { CustomError } from './CustomError';

/**
 * 📑 RequestValidationError - Custom error for handling request validation failures.
 * - Extends `CustomError` with a default HTTP status of `400 Bad Request`.
 * - Stores validation error details in the `metadata` field.
 */
export class RequestValidationError extends CustomError {
  /**
   * 🛑 Constructor for RequestValidationError.
   * @param details - An object containing validation error messages, where keys are field names and values are error messages.
   */
  constructor(details: string) {
    super('Validation failed', 400, details);
  }
}
