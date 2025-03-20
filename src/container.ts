// 📦 container.ts - Dependency Injection Container
import 'reflect-metadata'; // Required for tsyringe
import { container } from 'tsyringe';
import { DataSource } from 'typeorm';
import logger from './utils/logger';

// 📡 Import the lazy initializer for the DataSource
import { getAppDataSource } from './config/database';

// 🔄 Import dependencies (Repositories, Services, Interfaces)
import { UserRepository } from './repositories/UserRepository';
import { AuthenticationService } from './services/AuthenticationService';
import { PasswordService } from './services/PasswordService';
import { User } from './models/User';
import { ICRUD } from './services/ICRUD';
import { UserService } from './services/UserService';
import { BaseAppException } from './errors/BaseAppException';

/**
 * 🏗️ Registers all dependencies into the tsyringe container.
 * - Ensures the `DataSource` is initialized before usage.
 * - Registers repositories, services, and interfaces.
 */
export async function registerDependencies(): Promise<void> {
  try {
    logger.info('🔄 [DI] Initializing dependency injection container...');

    // 🚀 Initialize the database connection
    const dataSource = await getAppDataSource();

    // 🔗 Register the DataSource instance as a singleton
    container.register<DataSource>('DataSourceToken', {
      useValue: dataSource,
    });
    logger.info('✅ [DI] DataSource registered successfully.');

    // 📌 Register application services
    container.register('UserRepository', { useClass: UserRepository });
    container.register('AuthenticationService', {
      useClass: AuthenticationService,
    });
    container.register('PasswordService', { useClass: PasswordService });

    // 📌 Register UserService with ICRUD<User> interface
    container.register<ICRUD<User>>('UserService', { useClass: UserService });

    logger.info('✅ [DI] All dependencies registered successfully.');
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(
        `❌ [DI] Failed to register dependencies: ${error.message}`,
        {
          error,
        },
      );
    }
    throw new BaseAppException('Dependency registration failed.');
  }
}

export { container };
