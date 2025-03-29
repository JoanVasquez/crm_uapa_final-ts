import { NextFunction, Request, Response } from 'express';
import util from 'util';
import {
  QueryFailedError,
  EntityNotFoundError,
  CannotCreateEntityIdMapError,
} from 'typeorm';

import logger from '../utils/logger';
import { validationResult } from 'express-validator';
import ResponseTemplate from '../utils/response.template';
import httpStatus from '../utils/http.status';
import { CustomError } from '../errors/CustomError';
import { DuplicateRecordError } from '../errors/DuplicateRecordError';
import { ForeignKeyViolationError } from '../errors/ForeignKeyViolationError';
import { DatabaseError } from '../errors/DatabaseError';
import { RedisError } from '../errors/RedisError';
import { RequestValidationError } from '../errors/RequestValidationError';
import { AuthError } from '../errors/AuthError';
import { BaseAppException } from '../errors/BaseAppException';

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
  logger.error(
    `❌ [ErrorHandler] Error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`,
    {
      error: util.inspect(err, { depth: null }), // ✅ Fix applied here
    },
  );
  // ✅ Handle known application errors (CustomError)
  if (err instanceof CustomError) {
    return res
      .status(err.statusCode)
      .json(
        err.metadata
          ? new ResponseTemplate(
              err.statusCode,
              'ERROR',
              err.message,
              err.metadata,
            )
          : new ResponseTemplate(err.statusCode, 'ERROR', err.message),
      );
  }

  // ✅ Handle specific database errors (TypeORM & custom)
  if (err instanceof QueryFailedError) {
    return res.status(400).json(
      new ResponseTemplate(400, 'ERROR', 'Database query error', {
        message: err.message,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        query: (err as any).query,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parameters: (err as any).parameters,
      }),
    );
  }

  if (err instanceof EntityNotFoundError) {
    return res
      .status(404)
      .json(
        new ResponseTemplate(
          404,
          'ERROR',
          'Requested resource not found',
          err.message,
        ),
      );
  }

  if (err instanceof CannotCreateEntityIdMapError) {
    return res
      .status(500)
      .json(
        new ResponseTemplate(
          500,
          'ERROR',
          'Error creating entity ID map',
          err.message,
        ),
      );
  }

  // ✅ Handle custom database errors
  if (err instanceof DuplicateRecordError) {
    return res
      .status(409)
      .json(
        new ResponseTemplate(409, 'ERROR', 'Duplicate record', err.message),
      );
  }

  if (err instanceof ForeignKeyViolationError) {
    return res
      .status(400)
      .json(
        new ResponseTemplate(
          400,
          'ERROR',
          'Foreign key violation',
          err.message,
        ),
      );
  }

  if (err instanceof DatabaseError) {
    return res
      .status(500)
      .json(
        new ResponseTemplate(
          500,
          'ERROR',
          'Database error',
          err.metadata || err.message,
        ),
      );
  }

  // ✅ Handle Redis-related errors
  if (err instanceof RedisError) {
    return res
      .status(500)
      .json(
        new ResponseTemplate(
          500,
          'ERROR',
          'Redis error',
          err.metadata || err.message,
        ),
      );
  }

  // ✅ Handle validation errors
  if (err instanceof RequestValidationError) {
    return res
      .status(400)
      .json(
        new ResponseTemplate(400, 'ERROR', 'Validation failed', err.metadata),
      );
  }

  // ✅ Handle Auth Errors
  if (err instanceof AuthError) {
    return res
      .status(401)
      .json(
        new ResponseTemplate(401, 'ERROR', 'Authentication error', err.message),
      );
  }

  // ✅ Handle application-level exceptions
  if (err instanceof BaseAppException) {
    return res
      .status(err.statusCode)
      .json(
        new ResponseTemplate(
          err.statusCode,
          'ERROR',
          err.message,
          err.metadata,
        ),
      );
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
