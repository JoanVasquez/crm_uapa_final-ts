import { DataSource } from 'typeorm';
import { Product } from '../models/Product';
import logger from '../utils/logger';
import { GenericRepository } from './GenericRepository';
import { inject, injectable } from 'tsyringe';
import { BaseAppException } from '../errors/BaseAppException';

/**
 * 📦 ProductRepository - Handles database operations related to the `Product` entity.
 * - Extends `GenericRepository<Product>` to inherit standard CRUD operations.
 * - Implements custom queries such as `findProductByName`.
 */
@injectable()
export class ProductRepository extends GenericRepository<Product> {
  /**
   * 🏗️ Constructor - Injects the TypeORM `DataSource` instance.
   * @param dataSource - The database connection instance.
   */
  constructor(@inject('DataSourceToken') dataSource: DataSource) {
    super(dataSource, Product);
    logger.info('✅ [ProductRepository] Initialized ProductRepository');
  }

  /**
   * 🔍 Finds a product by its name.
   * @param name - The name of the product to search for.
   * @returns A promise resolving to the `Product` entity or `null` if not found.
   */
  async findProductByName(name: string): Promise<Product | null> {
    try {
      logger.info(
        `🔍 [ProductRepository] Searching for product with name: ${name}`,
      );

      const product = await this.repo.findOneBy({ name });

      if (!product) {
        logger.warn(
          `⚠️ [ProductRepository] No product found with name: ${name}`,
        );
        return null;
      }

      logger.info(`✅ [ProductRepository] Found product with name: ${name}`);
      return product;
    } catch (error) {
      logger.error(`❌ [ProductRepository] Error finding product by name:`, {
        error,
      });
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BaseAppException(
        `Error finding product by name: ${errorMessage}`,
      );
    }
  }
}
