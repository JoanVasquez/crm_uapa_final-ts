import { DataSource, Repository } from 'typeorm';
import { Sale } from '../../models/Sale';
import { SellRepository } from '../../repositories/SellRepository';
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

describe('SellRepository', () => {
  let sellRepository: SellRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRepository: jest.Mocked<Repository<Sale>>;

  const testSale: Sale = {
    id: 1,
    bill: {
      id: 1,
      customer: {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        bills: [],
      },
      date: new Date(),
      total_amount: 100,
      sales: [],
    },
    product: {
      id: 1,
      name: 'Test Product',
      description: 'Sample product',
      price: 19.99,
      available_quantity: 100,
      sales: [],
    },
    quantity: 2,
    sale_price: 39.98,
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
      find: jest.fn(),
      findAndCount: jest.fn(),
    } as unknown as jest.Mocked<Repository<Sale>>;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as unknown as jest.Mocked<DataSource>;

    // Create SellRepository instance
    sellRepository = new SellRepository(mockDataSource);
  });

  describe('constructor', () => {
    it('should initialize repository correctly', () => {
      expect(mockDataSource.getRepository).toHaveBeenCalledWith(Sale);
      expect(logger.info).toHaveBeenCalledWith(
        '✅ [SellRepository] Initialized SellRepository',
      );
    });
  });

  describe('createEntity', () => {
    it('should create a new sell entity successfully', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue(testSale);

      // Act
      const result = await sellRepository.createEntity(testSale);

      // Assert
      expect(result).toEqual(testSale);
      expect(mockRepository.save).toHaveBeenCalledWith(testSale);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Created new entity'),
      );
    });

    it('should handle errors when creating a sell entity', async () => {
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(sellRepository.createEntity(testSale)).rejects.toThrow(
        'Error creating entity',
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('findEntityById', () => {
    it('should find a sell entity by ID successfully', async () => {
      mockRepository.findOneBy.mockResolvedValue(testSale);

      const result = await sellRepository.findEntityById(testSale.id);

      expect(result).toEqual(testSale);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        id: testSale.id,
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved entity with ID'),
      );
    });

    it('should handle errors when querying the database', async () => {
      mockRepository.findOneBy.mockRejectedValue(new Error('DB error'));

      await expect(sellRepository.findEntityById(testSale.id)).rejects.toThrow(
        'Error finding entity',
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateEntity', () => {
    it('should update a sell entity successfully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOneBy.mockResolvedValue(testSale);

      const updatedData = { quantity: 5 };
      const result = await sellRepository.updateEntity(
        testSale.id,
        updatedData,
      );

      expect(result).toEqual(testSale);
      expect(mockRepository.update).toHaveBeenCalledWith(
        testSale.id,
        updatedData,
      );
    });

    it('should throw an error if the sell entity is not found for update', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);

      await expect(
        sellRepository.updateEntity(99, { quantity: 10 }),
      ).rejects.toThrow('Entity not found');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Entity with ID 99 not found for update'),
      );
    });
  });

  describe('deleteEntity', () => {
    it('should delete a sell entity successfully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await sellRepository.deleteEntity(testSale.id);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(testSale.id);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Deleted entity with ID'),
      );
    });

    it('should throw an error if the sell entity is not found for deletion', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockRepository.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(sellRepository.deleteEntity(99)).rejects.toThrow(
        'Entity not found',
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Entity with ID 99 not found for deletion'),
      );
    });
  });

  describe('getAllEntities', () => {
    it('should return all sell entities', async () => {
      mockRepository.find.mockResolvedValue([testSale]);

      const result = await sellRepository.getAllEntities();

      expect(result).toEqual([testSale]);
      expect(mockRepository.find).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved all entities'),
      );
    });

    it('should handle errors when fetching all entities', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(sellRepository.getAllEntities()).rejects.toThrow(
        'Error fetching all entities',
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getEntitiesWithPagination', () => {
    it('should return paginated sell entities', async () => {
      mockRepository.findAndCount.mockResolvedValue([[testSale], 1]);

      const page = 1;
      const perPage = 10;
      const expectedSkip = (page - 1) * perPage;

      const result = await sellRepository.getEntitiesWithPagination(
        page,
        perPage,
      );

      expect(result).toEqual({ data: [testSale], count: 1 });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        skip: expectedSkip,
        take: perPage,
      });
    });

    it('should handle errors when fetching paginated entities', async () => {
      mockRepository.findAndCount.mockRejectedValue(new Error('DB error'));

      await expect(
        sellRepository.getEntitiesWithPagination(0, 10),
      ).rejects.toThrow('Error fetching paginated entities');

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
