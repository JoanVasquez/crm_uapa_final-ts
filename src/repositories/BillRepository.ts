import { DataSource } from 'typeorm';
import { Bill } from '../models/Bill';
import logger from '../utils/logger';
import { GenericRepository } from './GenericRepository';
import { inject, injectable } from 'tsyringe';
import { BaseAppException } from '../errors/BaseAppException';

/**
 * 🧾 BillRepository - Handles database operations related to the `Bill` entity.
 * - Extends `GenericRepository<Bill>` to inherit standard CRUD operations.
 * - Implements custom queries such as `findBillsByCustomerId`.
 */
@injectable()
export class BillRepository extends GenericRepository<Bill> {
  /**
   * 🏗️ Constructor - Injects the TypeORM `DataSource` instance.
   * @param dataSource - The database connection instance.
   */
  constructor(@inject('DataSourceToken') dataSource: DataSource) {
    super(dataSource, Bill);
    logger.info('✅ [BillRepository] Initialized BillRepository');
  }

  /**
   * 🔍 Finds bills by customer ID.
   * @param customerId - The customer ID to search for.
   * @returns A promise resolving to an array of `Bill` entities.
   */
  async findBillsByCustomerId(customerId: number): Promise<Bill[]> {
    try {
      logger.info(
        `🔍 [BillRepository] Searching for bills with customer ID: ${customerId}`,
      );

      const bills = await this.repo.find({
        where: { customer: { id: customerId } },
      });

      if (!bills.length) {
        logger.warn(
          `⚠️ [BillRepository] No bills found for customer ID: ${customerId}`,
        );
        return [];
      }

      logger.info(
        `✅ [BillRepository] Found ${bills.length} bills for customer ID: ${customerId}`,
      );
      return bills;
    } catch (error) {
      logger.error(`❌ [BillRepository] Error finding bills by customer ID:`, {
        error,
      });
      throw new BaseAppException('Error finding bills by customer ID');
    }
  }
}
