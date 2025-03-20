import { DatabaseError } from '../../errors/DatabaseError';

describe('DatabaseError', () => {
  it('should create an error with default message', () => {
    const error = new DatabaseError();

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Database error');
    expect(error.statusCode).toBe(500);
  });

  it('should create an error with custom message', () => {
    const customMessage = 'Failed to connect to database';
    const error = new DatabaseError(customMessage);

    expect(error.message).toBe(customMessage);
    expect(error.statusCode).toBe(500);
  });

  it('should create an error with message and details', () => {
    const customMessage = 'Query execution failed';
    const errorDetails = {
      code: 'ECONNREFUSED',
      query: 'SELECT * FROM users',
    };
    const error = new DatabaseError(customMessage, errorDetails);

    expect(error.message).toBe(customMessage);
    expect(error.statusCode).toBe(500);
  });

  it('should maintain prototype chain', () => {
    const error = new DatabaseError();

    expect(error.constructor.name).toBe('DatabaseError');
    expect(Object.getPrototypeOf(error)).toBeInstanceOf(Object);
    expect(error instanceof DatabaseError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});
