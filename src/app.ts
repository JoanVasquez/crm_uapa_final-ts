import express, { Application, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './swagger';
import userRouter from './routes/user.router';
import ResponseTemplate from './utils/response.template';
import httpStatus from './utils/http.status';
import { errorHandler } from './middlewares/error-handler';
import logger from './utils/logger';

/**
 * 🚀 Express Application Setup
 * - Initializes middleware and routes.
 * - Configures Swagger documentation.
 * - Implements global error handling.
 */

const app: Application = express();

// 🔧 Middleware Setup
app.use(express.json());
app.use(cookieParser());

// 📌 Routes
app.use('/api/v1', userRouter);
logger.info('✅ [Server] API routes registered.');

logger.info('✅ [Server] API documentation generated.');
setupSwagger(app);

// ❌ Handle Unmatched Routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  logger.warn(`⚠️ [Server] Route not found: ${req.originalUrl}`);
  next(
    new ResponseTemplate(
      httpStatus.NOT_FOUND.code,
      httpStatus.NOT_FOUND.status,
      'Route not found',
    ),
  );
});

// ⚠️ Global Error Handler
app.use(errorHandler);
logger.info('✅ [Server] Global error handler registered.');

export default app;
