import { RedisError } from '../../errors/RedisError';

describe('RedisError', () => {
  it('should create an error with default message', () => {
    const error = new RedisError();

    expect(error).toBeInstanceOf(RedisError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Redis error');
    expect(error.statusCode).toBe(500);
  });

  it('should create an error with custom message', () => {
    const customMessage = 'Failed to connect to Redis';
    const error = new RedisError(customMessage);

    expect(error.message).toBe(customMessage);
    expect(error.statusCode).toBe(500);
  });

  it('should create an error with message and details', () => {
    const customMessage = 'Failed to set key';
    const errorDetails = { key: 'test-key', attempt: 3 };
    const error = new RedisError(customMessage, errorDetails);

    expect(error.message).toBe(customMessage);
    expect(error.statusCode).toBe(500);
  });

  it('should maintain stack trace', () => {
    const error = new RedisError();

    expect(error.stack).toBeDefined();
  });
});
