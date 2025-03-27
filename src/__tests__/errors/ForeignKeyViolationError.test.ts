import { ForeignKeyViolationError } from '../../errors/ForeignKeyViolationError';

describe('ForeignKeyViolationError', () => {
  it('should create error with default resource name', () => {
    const error = new ForeignKeyViolationError();

    expect(error).toBeInstanceOf(ForeignKeyViolationError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Foreign key violation');
    expect(error.statusCode).toBe(400);
  });

  it('should create error with custom resource name', () => {
    const resourceName = 'User';
    const error = new ForeignKeyViolationError(resourceName);

    expect(error).toBeInstanceOf(ForeignKeyViolationError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('User');
    expect(error.statusCode).toBe(400);
  });

  it('should maintain prototype chain', () => {
    const error = new ForeignKeyViolationError();

    expect(Object.getPrototypeOf(error)).toBe(
      ForeignKeyViolationError.prototype,
    );
    expect(error instanceof ForeignKeyViolationError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should have stack trace', () => {
    const error = new ForeignKeyViolationError();

    expect(error.stack).toBeDefined();
  });
});
