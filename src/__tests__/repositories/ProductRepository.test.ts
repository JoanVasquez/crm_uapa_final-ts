import { DataSource, Repository } from 'typeorm';
import { Product } from '../../models/Product';
import logger from '../../utils/logger';

// Mock dependencies before importing the class that uses them
jest.mock('../../utils/logger');
jest.mock('tsyringe', () => ({
  injectable: () => jest.fn(),
  inject: () => jest.fn(),
  container: {
    register: jest.fn(),
  },
}));

// Import after mocking dependencies
import { ProductRepository } from '../../repositories/ProductRepository';

describe('ProductRepository', () => {
  let productRepository: ProductRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRepository: jest.Mocked<Repository<Product>>;

  const testProduct: Product = {
    id: 1,
    name: 'Test Product',
    description: 'A sample product for testing',
    price: 19.99,
    available_quantity: 100,
    sells: [],
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repository
    mockRepository = {
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<Product>>;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as unknown as jest.Mocked<DataSource>;

    // Create ProductRepository instance
    productRepository = new ProductRepository(mockDataSource);
  });

  describe('constructor', () => {
    it('should initialize repository correctly', () => {
      expect(mockDataSource.getRepository).toHaveBeenCalledWith(Product);
      expect(logger.info).toHaveBeenCalledWith(
        '✅ [ProductRepository] Initialized ProductRepository',
      );
    });
  });

  describe('findProductByName', () => {
    it('should find product by name successfully', async () => {
      // Arrange
      mockRepository.findOneBy.mockResolvedValue(testProduct);
      const productName = 'Test Product';

      // Act
      const result = await productRepository.findProductByName(productName);

      // Assert
      expect(result).toEqual(testProduct);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        name: productName,
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `Searching for product with name: ${productName}`,
        ),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Found product with name: ${productName}`),
      );
    });

    it('should return null when product is not found', async () => {
      // Arrange
      mockRepository.findOneBy.mockResolvedValue(null);
      const productName = 'Nonexistent Product';

      // Act
      const result = await productRepository.findProductByName(productName);

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        name: productName,
      });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(`No product found with name: ${productName}`),
      );
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockRepository.findOneBy.mockRejectedValue(new Error(errorMessage));
      const productName = 'Test Product';

      // Act & Assert
      await expect(
        productRepository.findProductByName(productName),
      ).rejects.toThrow(`Error finding product by name: ${errorMessage}`);
      expect(logger.error).toHaveBeenCalledWith(
        '❌ [ProductRepository] Error finding product by name:',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('should handle non-Error objects in catch block', async () => {
      // Arrange
      mockRepository.findOneBy.mockRejectedValue('Some non-error object');
      const productName = 'Test Product';

      // Act & Assert
      await expect(
        productRepository.findProductByName(productName),
      ).rejects.toThrow('Error finding product by name: Unknown error');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ [ProductRepository] Error finding product by name:',
        expect.objectContaining({ error: 'Some non-error object' }),
      );
    });
  });

  describe('inherited methods', () => {
    it('should inherit CRUD operations from GenericRepository', () => {
      // Verify that ProductRepository has inherited methods
      expect(productRepository.createEntity).toBeDefined();
      expect(productRepository.findEntityById).toBeDefined();
      expect(productRepository.updateEntity).toBeDefined();
      expect(productRepository.deleteEntity).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockRepository.findOneBy.mockRejectedValue(
        new Error('Connection refused'),
      );
      const productName = 'Test Product';

      // Act & Assert
      await expect(
        productRepository.findProductByName(productName),
      ).rejects.toThrow('Error finding product by name: Connection refused');
    });

    it('should handle unexpected error types', async () => {
      // Arrange
      mockRepository.findOneBy.mockRejectedValue({
        customError: 'Custom error object',
      });
      const productName = 'Test Product';

      // Act & Assert
      await expect(
        productRepository.findProductByName(productName),
      ).rejects.toThrow('Error finding product by name: Unknown error');
    });
  });

  describe('logging behavior', () => {
    it('should log appropriate messages for successful operations', async () => {
      // Arrange
      mockRepository.findOneBy.mockResolvedValue(testProduct);
      const productName = 'Test Product';

      // Act
      await productRepository.findProductByName(productName);

      // Assert
      expect(logger.info).toHaveBeenCalledTimes(4); // Search start and success
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log warning for not found cases', async () => {
      // Arrange
      mockRepository.findOneBy.mockResolvedValue(null);
      const productName = 'Nonexistent Product';

      // Act
      await productRepository.findProductByName(productName);

      // Assert
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
