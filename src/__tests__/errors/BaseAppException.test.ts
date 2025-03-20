import { BaseAppException } from '../../errors/BaseAppException';

describe('BaseAppException', () => {
  it('should create an exception with default values', () => {
    const error = new BaseAppException();

    expect(error).toBeInstanceOf(BaseAppException);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Application error');
    expect(error.statusCode).toBe(500);
  });

  it('should create an exception with custom message', () => {
    const message = 'Custom error message';
    const error = new BaseAppException(message);

    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(500);
  });

  it('should create an exception with custom message and status code', () => {
    const message = 'Custom error message';
    const statusCode = 400;
    const error = new BaseAppException(message, statusCode);

    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
  });

  it('should create an exception with custom message, status code and details', () => {
    const message = 'Custom error message';
    const statusCode = 400;
    const details = { field: 'username', error: 'Required' };
    const error = new BaseAppException(message, statusCode, details);

    expect(error.message).toBe(message);
    expect(error.statusCode).toBe(statusCode);
  });

  it('should maintain prototype chain', () => {
    const error = new BaseAppException();

    expect(error instanceof BaseAppException).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should have stack trace', () => {
    const error = new BaseAppException();

    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });
});
