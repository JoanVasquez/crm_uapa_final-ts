import { CustomError } from '../../errors/CustomError';

// Create a concrete implementation of CustomError for testing
class TestError extends CustomError {
  constructor(message: string, statusCode: number, metadata?: unknown) {
    super(message, statusCode, metadata);
  }
}

describe('CustomError', () => {
  it('should create an error with message and status code', () => {
    const error = new TestError('Test error', 400);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CustomError);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
  });

  it('should handle metadata when provided', () => {
    const metadata = { detail: 'Additional information' };
    const error = new TestError('Test error', 500, metadata);

    expect(error.metadata).toEqual(metadata);
  });

  it('should have undefined metadata when not provided', () => {
    const error = new TestError('Test error', 404);

    expect(error.metadata).toBeUndefined();
  });

  it('should maintain proper prototype chain', () => {
    const error = new TestError('Test error', 403);

    expect(Object.getPrototypeOf(error)).toBe(TestError.prototype);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof CustomError).toBe(true);
  });

  it('should capture stack trace', () => {
    const error = new TestError('Test error', 500);

    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });

  it('should allow access to all properties', () => {
    const metadata = { code: 'INVALID_INPUT' };
    const error = new TestError('Test error', 400, metadata);

    expect(error).toEqual(
      expect.objectContaining({
        message: 'Test error',
        statusCode: 400,
        metadata: metadata,
      }),
    );
  });
});
