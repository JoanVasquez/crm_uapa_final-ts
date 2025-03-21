import { Bill } from '../models/Bill';
import { BillRepository } from '../repositories/BillRepository';
import { GenericService } from './GenericService';
import { Cache } from '../utils/cacheUtil';
import logger from '../utils/logger';
import { inject, injectable } from 'tsyringe';

/**
 * 🧾 BillService - Manages business logic related to bills.
 * - Extends `GenericService<Bill>` for common CRUD functionalities.
 * - Uses caching for optimization.
 */
@injectable()
export class BillService extends GenericService<Bill> {
  constructor(
    @inject('Cache') protected readonly cache: Cache,
    @inject('BillRepository')
    private readonly billRepository: BillRepository,
  ) {
    super(cache, billRepository, Bill);
    logger.info('✅ [BillService] Initialized BillService');
  }

  /**
   * 🔍 Finds bills by customer ID.
   * - First checks the cache.
   * - If not cached, queries the database and stores in cache.
   *
   * @param customerId - The customer ID.
   * @returns A list of bills.
   */
  async findByCustomerId(customerId: number): Promise<Bill[]> {
    logger.info(
      `🔍 [BillService] Searching for bills with customer ID: ${customerId}`,
    );

    const cacheKey = `bill:customer:${customerId}`;
    const cachedBills = await this.cache.get(cacheKey);
    if (cachedBills) {
      logger.info(
        `✅ [BillService] Retrieved bills from cache for customer ID: ${customerId}`,
      );
      return JSON.parse(cachedBills);
    }

    const bills = await this.billRepository.findBillsByCustomerId(customerId);
    if (bills.length) {
      await this.cache.set(cacheKey, JSON.stringify(bills), 3600);
      logger.info(
        `✅ [BillService] Cached bills for customer ID: ${customerId}`,
      );
    } else {
      logger.warn(
        `⚠️ [BillService] No bills found for customer ID: ${customerId}`,
      );
    }

    return bills;
  }
}
