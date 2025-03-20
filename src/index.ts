/**
 * 🚀 index.ts - Application Bootstrap
 * - Loads environment variables.
 * - Initializes the dependency container, Redis cache, and database.
 * - Dynamically imports the Express app and starts the server.
 */

import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import { registerDependencies, container } from './container';
import logger from './utils/logger';
import { initCache } from './utils/cacheUtil';

// ⚠️ Do NOT import app at the top level to ensure dependencies are fully initialized!

(async () => {
  try {
    logger.info('🔄 [Startup] Initializing application...');

    // 🔥 Initialize Redis Cache and Register it in the Container
    const cacheInstance = await initCache();
    container.register('Cache', { useValue: cacheInstance });
    logger.info('✅ [Startup] Redis cache initialized successfully.');

    // 🔗 Initialize Database and Register Dependencies
    await registerDependencies();
    logger.info(
      '✅ [Startup] Database initialized and dependencies registered.',
    );

    // 📌 Dynamically Import Express App after Initialization
    const { default: app } = await import('./app');

    // 🌍 Start the Server
    const PORT = process.env.PORT ?? 8000;
    app.listen(PORT, () => {
      logger.info(`🚀 [Server] Running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('❌ [Startup] Error during application initialization:', {
      error,
    });
    process.exit(1); // 🔴 Exit process if initialization fails
  }
})();
