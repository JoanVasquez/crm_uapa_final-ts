import { NotFoundError } from '../../errors/NotFoundError';

describe('NotFoundError', () => {
  it('should create error with default resource name', () => {
    const error = new NotFoundError();

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Resource not found');
    expect(error.statusCode).toBe(404);
  });

  it('should create error with custom resource name', () => {
    const resourceName = 'User';
    const error = new NotFoundError(resourceName);

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('User not found');
    expect(error.statusCode).toBe(404);
  });

  it('should maintain prototype chain', () => {
    const error = new NotFoundError();

    expect(Object.getPrototypeOf(error)).toBe(NotFoundError.prototype);
    expect(error instanceof NotFoundError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should have stack trace', () => {
    const error = new NotFoundError();

    expect(error.stack).toBeDefined();
  });
});
