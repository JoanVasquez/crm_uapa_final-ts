import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Bill } from '../models/Bill';
import { Sell } from '../models/Sell';
import { getParameterDirect } from '../utils/ssmUtil';
import logger from '../utils/logger';
import { BaseAppException } from '../errors/BaseAppException';
import { Customer } from '../models/Customer';

/**
 * 📦 Database Connection Utility
 * - Manages a singleton DataSource instance for TypeORM.
 * - Uses in-memory SQLite for tests.
 * - Loads database configuration from AWS SSM for other environments.
 */

let appDataSource: DataSource | null = null; // Holds the DataSource instance

/**
 * 🔌 Returns a lazily initialized DataSource instance.
 * - Uses SQLite in-memory database for test environments.
 * - Retrieves MySQL/PostgreSQL configuration from AWS SSM in production.
 *
 * @returns A promise resolving to an initialized DataSource instance.
 */
export async function getAppDataSource(): Promise<DataSource> {
  if (appDataSource?.isInitialized) {
    logger.info('✅ [Database] Reusing existing DataSource instance.');
    return appDataSource;
  }

  let dataSourceOptions: DataSourceOptions;

  if (process.env.NODE_ENV === 'test') {
    // 🧪 Test environment: in-memory SQLite database
    dataSourceOptions = {
      type: 'sqlite',
      database: ':memory:',
      entities: [User, Customer, Product, Bill, Sell],
      synchronize: false,
    };
    logger.info('🛠️ [Database] Using in-memory SQLite for testing.');
  } else {
    try {
      // 🔍 Production/Development: Load database config from AWS SSM
      logger.info(
        '🔑 [Database] Fetching database credentials from AWS SSM...',
      );

      const type = (await getParameterDirect(process.env.SSM_DB_TYPE!)) as
        | 'mysql'
        | 'postgres'
        | 'sqlite';
      const host = await getParameterDirect(process.env.SSM_DB_HOST!);
      const port = parseInt(
        await getParameterDirect(process.env.SSM_DB_PORT!),
        10,
      );
      const username = await getParameterDirect(process.env.SSM_DB_USERNAME!);
      const password = await getParameterDirect(process.env.SSM_DB_PASSWORD!);
      const database = await getParameterDirect(process.env.SSM_DB_NAME!);

      dataSourceOptions = {
        type,
        host,
        port,
        username,
        password,
        database,
        entities: [User, Customer, Product, Bill, Sell],
        synchronize: true, // ⚠️ Auto-migration enabled (use cautiously in production)
      };

      logger.info(
        `✅ [Database] Configuration loaded for ${type.toUpperCase()} database: ${database} at ${host}:${port}`,
      );
    } catch (error: unknown) {
      // ✅ Replace any with unknown
      if (error instanceof Error) {
        logger.error(
          `❌ [Database] Failed to fetch database configuration: ${error.message}`,
          { error },
        );
      }
      throw new BaseAppException('Database initialization failed.');
    }
  }

  try {
    // 🚀 Create and initialize the DataSource instance
    appDataSource = new DataSource(dataSourceOptions);
    await appDataSource.initialize();
    logger.info('📡 [Database] Connection initialized successfully.');
  } catch (error: unknown) {
    // ✅ Replace any with unknown
    if (error instanceof Error) {
      logger.error(
        `❌ [Database] Failed to fetch database configuration: ${error.message}`,
        { error },
      );
    }
    throw new BaseAppException(`Database connection failed`);
  }

  return appDataSource;
}
