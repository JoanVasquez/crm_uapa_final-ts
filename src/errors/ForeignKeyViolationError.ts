import { CustomError } from './CustomError';

/**
 * 🔗 ForeignKeyViolationError - Error para violaciones de claves foráneas.
 */
export class ForeignKeyViolationError extends CustomError {
  constructor(message = 'Foreign key violation') {
    super(message, 400); // 400 - Bad Request
  }
}
