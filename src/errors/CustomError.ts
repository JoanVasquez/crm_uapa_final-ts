/**
 * 🚨 CustomError - Abstract class for structured error handling.
 * - Provides a base error class with an HTTP status code and optional metadata.
 */
export abstract class CustomError extends Error {
  public statusCode: number;
  public metadata?: unknown; // Additional error details

  /**
   * 🛑 Constructor for CustomError.
   * @param message - The error message.
   * @param statusCode - The HTTP status code associated with the error.
   * @param metadata - Optional additional details about the error.
   */
  constructor(message: string, statusCode: number, metadata?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.metadata = metadata;

    // ✅ Ensures proper prototype chain restoration
    Object.setPrototypeOf(this, new.target.prototype);

    // 🔍 Captures the stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}
