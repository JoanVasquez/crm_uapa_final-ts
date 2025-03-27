import { DataSource } from 'typeorm';
import { Sale } from '../models/Sale';
import logger from '../utils/logger';
import { GenericRepository } from './GenericRepository';
import { inject, injectable } from 'tsyringe';

/**
 * 🛍️ SellRepository - Handles database operations related to the `Sell` entity.
 * - Extends `GenericRepository<Sell>` to inherit standard CRUD operations.
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
}
