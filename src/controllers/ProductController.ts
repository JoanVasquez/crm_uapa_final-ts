import { autoInjectable, inject } from 'tsyringe';
import BaseController from './BaseController';
import { ICRUD } from '../services/ICRUD';
import { Product } from '../models/Product';
import logger from '../utils/logger';

/**
 * 🏬 ProductController - Handles API requests related to products.
 * - Extends `BaseController` for standard CRUD operations.
 * - Supports full CRUD functionality (Create, Read, Update, Delete).
 */
@autoInjectable()
export default class ProductController extends BaseController {
  constructor(
    @inject('ProductService') protected productService?: ICRUD<Product>,
  ) {
    super(productService!);
    logger.info('✅ [ProductController] Initialized ProductController');
  }
}
