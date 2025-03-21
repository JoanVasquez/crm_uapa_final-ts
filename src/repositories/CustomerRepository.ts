import { DataSource } from 'typeorm';
import { Customer } from '../models/Customer';
import logger from '../utils/logger';
import { GenericRepository } from './GenericRepository';
import { inject, injectable } from 'tsyringe';
import { BaseAppException } from '../errors/BaseAppException';

/**
 * 👤 CustomerRepository - Handles database operations related to the `Customer` entity.
 * - Extends `GenericRepository<Customer>` to inherit standard CRUD operations.
 * - Implements custom queries such as `findCustomerByEmail`.
 */
@injectable()
export class CustomerRepository extends GenericRepository<Customer> {
  /**
   * 🏗️ Constructor - Injects the TypeORM `DataSource` instance.
   * @param dataSource - The database connection instance.
   */
  constructor(@inject('DataSourceToken') dataSource: DataSource) {
    super(dataSource, Customer);
    logger.info('✅ [CustomerRepository] Initialized CustomerRepository');
  }

  /**
   * 🔍 Finds a customer by their email.
   * @param email - The email to search for.
   * @returns A promise resolving to the `Customer` entity or `null` if not found.
   */
  async findCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      logger.info(
        `🔍 [CustomerRepository] Searching for customer with email: ${email}`,
      );

      const customer = await this.repo.findOneBy({ email });

      if (!customer) {
        logger.warn(
          `⚠️ [CustomerRepository] No customer found with email: ${email}`,
        );
        return null;
      }

      logger.info(
        `✅ [CustomerRepository] Found customer with email: ${email}`,
      );
      return customer;
    } catch (error) {
      logger.error(`❌ [CustomerRepository] Error finding customer by email:`, {
        error,
      });
      throw new BaseAppException('Error finding customer by email');
    }
  }
}
