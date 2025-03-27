import { DuplicateRecordError } from '../../errors/DuplicateRecordError';

describe('DuplicateRecordError', () => {
  it('should create error with default resource name', () => {
    const error = new DuplicateRecordError();

    expect(error).toBeInstanceOf(DuplicateRecordError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Duplicate record');
    expect(error.statusCode).toBe(409);
  });

  it('should create error with custom resource name', () => {
    const resourceName = 'User';
    const error = new DuplicateRecordError(resourceName);

    expect(error).toBeInstanceOf(DuplicateRecordError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('User');
    expect(error.statusCode).toBe(409);
  });

  it('should maintain prototype chain', () => {
    const error = new DuplicateRecordError();

    expect(Object.getPrototypeOf(error)).toBe(DuplicateRecordError.prototype);
    expect(error instanceof DuplicateRecordError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should have stack trace', () => {
    const error = new DuplicateRecordError();

    expect(error.stack).toBeDefined();
  });
});
