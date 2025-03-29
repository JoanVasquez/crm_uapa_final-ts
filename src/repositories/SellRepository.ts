import { DataSource } from 'typeorm';
import { Sale } from '../models/Sale';
import logger from '../utils/logger';
import { GenericRepository } from './GenericRepository';
import { inject, injectable } from 'tsyringe';
import { DatabaseError } from '../errors/DatabaseError';

/**
 * 🛍️ SellRepository - Handles database operations related to the `Sale` entity.
 * - Extends `GenericRepository<Sale>` to inherit standard CRUD operations.
 * - Implements custom queries such as `findSalesByBillId`.
 */
@injectable()
export class SellRepository extends GenericRepository<Sale> {
  /**
   * 🏗️ Constructor - Injects the TypeORM `DataSource` instance.
   * @param dataSource - The database connection instance.
   */
  constructor(@inject('DataSourceToken') dataSource: DataSource) {
    super(dataSource, Sale);
    logger.info('✅ [SellRepository] Initialized SellRepository');
  }

  /**
   * 📚 Get paginated sales with relationships (bill, product, and bill.customer)
   * - Returns paginated sales including related entities.
   * @param page - The current page number.
   * @param perPage - The number of records per page.
   * @returns Paginated sales and total count.
   */
  async getEntitiesWithPagination(
    page: number,
    perPage: number,
  ): Promise<{ data: Sale[]; count: number }> {
    try {
      const skip = (page - 1) * perPage;
      const take = perPage;

      // ✅ Fetch sales with all relationships
      const [data, count] = await this.repo.findAndCount({
        relations: [
          'bill', // Include Bill
          'bill.customer', // Include Bill's Customer
          'product', // Include Product
        ],
        skip,
        take,
      });

      logger.info(
        `✅ [SellRepository] Retrieved ${data.length} sales records (Page: ${page}, PerPage: ${perPage})`,
      );

      return { data, count };
    } catch (error) {
      logger.error(
        `❌ [SellRepository] Error fetching paginated sales with relationships:`,
        { error },
      );

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      throw new DatabaseError(
        'Error fetching paginated sales with relationships',
        errorMessage,
      );
    }
  }
}
