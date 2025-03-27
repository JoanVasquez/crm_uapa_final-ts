import { ProductService } from '../../services/ProductService';
import { Product } from '../../models/Product';
import { ProductRepository } from '../../repositories/ProductRepository';
import { Cache } from '../../utils/cacheUtil';
import logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('tsyringe', () => ({
  injectable: () => jest.fn(),
  inject: () => jest.fn(),
  container: {
    resolve: jest.fn(),
    register: jest.fn(),
  },
}));
jest.mock('../../repositories/ProductRepository');

describe('ProductService', () => {
  let productService: ProductService;
  let mockCache: jest.Mocked<Cache>;
  let mockProductRepository: jest.Mocked<ProductRepository>;

  const testProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'A sample product for testing',
    price: 19.99,
    available_quantity: 100,
    sales: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create Mock Cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      client: {},
    } as unknown as jest.Mocked<Cache>;

    // Mock ProductRepository
    mockProductRepository = {
      createEntity: jest.fn(),
      findEntityById: jest.fn(),
      findProductByName: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntity: jest.fn(),
      getAllEntities: jest.fn(),
      getEntitiesWithPagination: jest.fn(),
    } as unknown as jest.Mocked<ProductRepository>;

    // Create Service Instance
    productService = new ProductService(mockCache, mockProductRepository);
  });

  describe('constructor', () => {
    it('should initialize service correctly', () => {
      expect(logger.info).toHaveBeenCalledWith(
        '✅ [ProductService] Initialized ProductService',
      );
    });
  });

  describe('findByName', () => {
    it('should return product from cache if found', async () => {
      const cacheKey = `product:${testProduct.name}`;
      mockCache.get.mockResolvedValue(JSON.stringify(testProduct));

      const result = await productService.findByName(testProduct.name);

      expect(result).toEqual(testProduct);
      expect(mockCache.get).toHaveBeenCalledWith(cacheKey);
      expect(mockProductRepository.findProductByName).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved product from cache'),
      );
    });

    it('should fetch product from DB if not in cache', async () => {
      const cacheKey = `product:${testProduct.name}`;
      mockCache.get.mockResolvedValue(null);
      mockProductRepository.findProductByName.mockResolvedValue(testProduct);

      const result = await productService.findByName(testProduct.name);

      expect(result).toEqual(testProduct);
      expect(mockProductRepository.findProductByName).toHaveBeenCalledWith(
        testProduct.name,
      );
      expect(mockCache.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(testProduct),
        3600,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cached product'),
      );
    });

    it('should return null if product is not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockProductRepository.findProductByName.mockResolvedValue(null);

      const result = await productService.findByName('Nonexistent Product');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Product not found'),
      );
    });
  });

  describe('logging behavior', () => {
    it('should log appropriate messages for successful operations', async () => {
      mockCache.get.mockResolvedValue(JSON.stringify(testProduct));

      await productService.findByName(testProduct.name);

      expect(logger.info).toHaveBeenCalledTimes(4);
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log warning for not found cases', async () => {
      mockCache.get.mockResolvedValue(null);
      mockProductRepository.findProductByName.mockResolvedValue(null);

      await productService.findByName('Nonexistent Product');

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
