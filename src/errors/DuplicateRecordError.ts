import { CustomError } from './CustomError';

/**
 * 🚨 DuplicateRecordError - Error para registros duplicados.
 */
export class DuplicateRecordError extends CustomError {
  constructor(message = 'Duplicate record') {
    super(message, 409); // 409 - Conflict
  }
}
