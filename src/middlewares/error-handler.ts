import { NextFunction, Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { CustomError } from '../errors/CustomError';
import logger from '../utils/logger';
import { validationResult } from 'express-validator';
import ResponseTemplate from '../utils/response.template';
import httpStatus from '../utils/http.status';

/**
 * 🚨 errorHandler - Express error-handling middleware.
 * - Logs and formats error responses.
 * - Handles application errors, database errors, and unexpected exceptions.
 */
export const errorHandler = (
  err: unknown, // Use unknown for better type safety
  req: Request,
  res: Response,
  // eslint-disable-next-line no-unused-vars
  _next: NextFunction,
): Response<unknown, Record<string, unknown>> | void => {
  logger.error(`❌ [ErrorHandler] Error occurred:`, { error: err });

  // ✅ Handle known application errors (CustomError)
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json(
      err.metadata != null
        ? new ResponseTemplate(
            err.statusCode,
            'ERROR',
            err.message,
            err.metadata,
          ) // ✅ Pass metadata normally
        : new ResponseTemplate(err.statusCode, 'ERROR', err.message), // ✅ Don't pass metadata at all
    );
  }

  // ✅ Handle database-related errors
  if (err instanceof QueryFailedError) {
    return res
      .status(400)
      .json(
        new ResponseTemplate(400, 'ERROR', 'Database query error', err.message),
      );
  }

  if (err instanceof EntityNotFoundError) {
    return res
      .status(404)
      .json(new ResponseTemplate(404, 'ERROR', 'Requested resource not found'));
  }

  // ❌ Fallback for unhandled errors
  return res
    .status(500)
    .json(new ResponseTemplate(500, 'ERROR', 'Internal Server Error'));
};

/**
 * 📑 validateRequest - Express middleware for request validation.
 * - Uses `express-validator` to validate incoming requests.
 * - Sends a formatted error response if validation fails.
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn(`⚠️ [Validation] Request validation failed`, {
      details: errors.array(),
    });
    return res
      .status(httpStatus.BAD_REQUEST.code)
      .json(
        new ResponseTemplate(
          httpStatus.BAD_REQUEST.code,
          httpStatus.BAD_REQUEST.status,
          'Validation failed',
          errors.array(),
        ),
      );
  }

  next();
};
