import { RequestValidationError } from '../../errors/RequestValidationError';

describe('RequestValidationError', () => {
  it('should create an instance with the correct properties', () => {
    const errorDetails = 'Invalid email format';
    const error = new RequestValidationError(errorDetails);

    expect(error).toBeInstanceOf(RequestValidationError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.metadata).toBe(errorDetails);
  });

  it('should maintain the error prototype chain', () => {
    const error = new RequestValidationError('Test error');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof RequestValidationError).toBe(true);
  });

  it('should handle empty details string', () => {
    const error = new RequestValidationError('');
    expect(error.metadata).toBe('');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Validation failed');
  });

  it('should preserve stack trace', () => {
    const error = new RequestValidationError('Test error');
    expect(error.stack).toBeDefined();
  });
});
