import { Product } from '../models/Product';
import { ProductRepository } from '../repositories/ProductRepository';
import { GenericService } from './GenericService';
import { Cache } from '../utils/cacheUtil';
import logger from '../utils/logger';
import { inject, injectable } from 'tsyringe';

/**
 * 🏬 ProductService - Manages business logic related to products.
 * - Extends `GenericService<Product>` for common CRUD functionalities.
 * - Uses caching for optimization.
 */
@injectable()
export class ProductService extends GenericService<Product> {
  constructor(
    @inject('Cache') protected readonly cache: Cache,
    @inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {
    super(cache, productRepository, Product);
    logger.info('✅ [ProductService] Initialized ProductService');
  }

  /**
   * 🔍 Finds a product by its name.
   * - First checks the cache.
   * - If not cached, queries the database and stores in cache.
   *
   * @param name - The product name.
   * @returns The found product or `null` if not found.
   */
  async findByName(name: string): Promise<Product | null> {
    logger.info(`🔍 [ProductService] Searching for product: ${name}`);

    const cacheKey = `product:${name}`;
    const cachedProduct = await this.cache.get(cacheKey);
    if (cachedProduct) {
      logger.info(`✅ [ProductService] Retrieved product from cache: ${name}`);
      return JSON.parse(cachedProduct);
    }

    const product = await this.productRepository.findProductByName(name);
    if (product) {
      await this.cache.set(cacheKey, JSON.stringify(product), 3600);
      logger.info(`✅ [ProductService] Cached product: ${name}`);
    } else {
      logger.warn(`⚠️ [ProductService] Product not found: ${name}`);
    }

    return product;
  }
}
