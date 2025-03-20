import { AuthError } from '../../errors/AuthError';

describe('AuthError', () => {
  it('should create an AuthError with default message', () => {
    const error = new AuthError();

    expect(error).toBeInstanceOf(AuthError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Authentication error');
    expect(error.statusCode).toBe(401);
  });

  it('should create an AuthError with custom message', () => {
    const customMessage = 'Invalid credentials provided';
    const error = new AuthError(customMessage);

    expect(error.message).toBe(customMessage);
    expect(error.statusCode).toBe(401);
  });

  it('should maintain prototype chain', () => {
    const error = new AuthError();

    expect(Object.getPrototypeOf(error)).toBe(AuthError.prototype);
    expect(error instanceof AuthError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should have correct name property', () => {
    const error = new AuthError();

    expect(error.name).toBe('Error');
  });
});
