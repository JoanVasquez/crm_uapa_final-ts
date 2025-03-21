import { Customer } from '../models/Customer';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { GenericService } from './GenericService';
import { Cache } from '../utils/cacheUtil';
import logger from '../utils/logger';
import { inject, injectable } from 'tsyringe';

/**
 * 👤 CustomerService - Manages business logic related to customers.
 * - Extends `GenericService<Customer>` for common CRUD functionalities.
 * - Uses caching for optimization.
 */
@injectable()
export class CustomerService extends GenericService<Customer> {
  constructor(
    @inject('Cache') protected readonly cache: Cache,
    @inject('CustomerRepository')
    private readonly customerRepository: CustomerRepository,
  ) {
    super(cache, customerRepository, Customer);
    logger.info('✅ [CustomerService] Initialized CustomerService');
  }

  /**
   * 🔍 Finds a customer by email.
   * - First checks the cache.
   * - If not cached, queries the database and stores in cache.
   *
   * @param email - The customer's email.
   * @returns The found customer or `null` if not found.
   */
  async findByEmail(email: string): Promise<Customer | null> {
    logger.info(`🔍 [CustomerService] Searching for customer: ${email}`);

    const cacheKey = `customer:${email}`;
    const cachedCustomer = await this.cache.get(cacheKey);
    if (cachedCustomer) {
      logger.info(
        `✅ [CustomerService] Retrieved customer from cache: ${email}`,
      );
      return JSON.parse(cachedCustomer);
    }

    const customer = await this.customerRepository.findCustomerByEmail(email);
    if (customer) {
      await this.cache.set(cacheKey, JSON.stringify(customer), 3600);
      logger.info(`✅ [CustomerService] Cached customer: ${email}`);
    } else {
      logger.warn(`⚠️ [CustomerService] Customer not found: ${email}`);
    }

    return customer;
  }
}
