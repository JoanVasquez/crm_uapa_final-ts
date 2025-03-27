// 📦 container.ts - Dependency Injection Container
import 'reflect-metadata'; // Required for tsyringe
import { container } from 'tsyringe';
import { DataSource } from 'typeorm';
import logger from './utils/logger';

// 📡 Import the lazy initializer for the DataSource
import { getAppDataSource } from './config/database';

// 🔄 Import dependencies (Repositories, Services, Interfaces)
import { UserRepository } from './repositories/UserRepository';
import { ProductRepository } from './repositories/ProductRepository';
import { AuthenticationService } from './services/AuthenticationService';
import { PasswordService } from './services/PasswordService';
import { User } from './models/User';
import { Product } from './models/Product';
import { ICRUD } from './services/ICRUD';
import { UserService } from './services/UserService';
import { ProductService } from './services/ProductService';
import { BaseAppException } from './errors/BaseAppException';
import { SellRepository } from './repositories/SellRepository';
import { BillRepository } from './repositories/BillRepository';
import { CustomerRepository } from './repositories/CustomerRepository';
import { BillService } from './services/BillService';
import { Bill } from './models/Bill';
import { Customer } from './models/Customer';
import { CustomerService } from './services/CustomerService';
import { Sell } from './models/Sell';
import { SellService } from './services/SellService';

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

    // 📌 Register Repositories
    container.register('UserRepository', { useClass: UserRepository });
    container.register('SellRepository', { useClass: SellRepository });
    container.register('BillRepository', { useClass: BillRepository });
    container.register('CustomerRepository', { useClass: CustomerRepository });
    container.register('ProductRepository', { useClass: ProductRepository });

    container.register('AuthenticationService', {
      useClass: AuthenticationService,
    });
    container.register('PasswordService', { useClass: PasswordService });

    // 📌 Register Services with ICRUD Interface
    container.register<ICRUD<User>>('UserService', { useClass: UserService });
    container.register<ICRUD<Bill>>('BillService', { useClass: BillService });
    container.register<ICRUD<Customer>>('CustomerService', {
      useClass: CustomerService,
    });
    container.register<ICRUD<Sell>>('SellService', { useClass: SellService });
    container.register<ICRUD<Product>>('ProductService', {
      useClass: ProductService,
    });
    container.register('CustomerServiceImpl', {
      useClass: CustomerService,
    });

    container.register('UserServiceImpl', {
      useClass: UserService,
    });

    container.register('SellServiceImpl', {
      useClass: SellService,
    });

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
