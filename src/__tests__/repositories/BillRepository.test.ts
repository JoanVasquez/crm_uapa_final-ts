import { DataSource, Repository } from 'typeorm';
import { Bill } from '../../models/Bill';
import { BillRepository } from '../../repositories/BillRepository';
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

describe('BillRepository', () => {
  let billRepository: BillRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRepository: jest.Mocked<Repository<Bill>>;

  const testBill: Bill = {
    id: 1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customer: { id: 1 } as any,
    date: new Date(),
    total_amount: 50.0,
    sells: [],
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repository
    mockRepository = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<Bill>>;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as unknown as jest.Mocked<DataSource>;

    // Create BillRepository instance
    billRepository = new BillRepository(mockDataSource);
  });

  describe('constructor', () => {
    it('should initialize repository correctly', () => {
      expect(mockDataSource.getRepository).toHaveBeenCalledWith(Bill);
      expect(logger.info).toHaveBeenCalledWith(
        '✅ [BillRepository] Initialized BillRepository',
      );
    });
  });

  describe('findBillsByCustomerId', () => {
    it('should find bills by customer ID successfully', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([testBill]);
      const customerId = 1;

      // Act
      const result = await billRepository.findBillsByCustomerId(customerId);

      // Assert
      expect(result).toEqual([testBill]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { customer: { id: customerId } },
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `Searching for bills with customer ID: ${customerId}`,
        ),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Found 1 bills for customer ID: ${customerId}`),
      );
    });

    it('should return an empty array when no bills are found', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue([]);
      const customerId = 999;

      // Act
      const result = await billRepository.findBillsByCustomerId(customerId);

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { customer: { id: customerId } },
      });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `No bills found for customer ID: ${customerId}`,
        ),
      );
    });

    it('should throw an error when database query fails', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockRepository.find.mockRejectedValue(new Error(errorMessage));
      const customerId = 1;

      // Act & Assert
      await expect(
        billRepository.findBillsByCustomerId(customerId),
      ).rejects.toThrow('Error finding bills by customer ID');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ [BillRepository] Error finding bills by customer ID:',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('should handle non-Error objects in catch block', async () => {
      // Arrange
      mockRepository.find.mockRejectedValue('Some non-error object');
      const customerId = 1;

      // Act & Assert
      await expect(
        billRepository.findBillsByCustomerId(customerId),
      ).rejects.toThrow('Error finding bills by customer ID');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ [BillRepository] Error finding bills by customer ID:',
        expect.objectContaining({ error: 'Some non-error object' }),
      );
    });
  });

  describe('inherited methods', () => {
    it('should inherit CRUD operations from GenericRepository', () => {
      expect(billRepository.createEntity).toBeDefined();
      expect(billRepository.findEntityById).toBeDefined();
      expect(billRepository.updateEntity).toBeDefined();
      expect(billRepository.deleteEntity).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      mockRepository.find.mockRejectedValue(new Error('Connection refused'));
      const customerId = 1;

      await expect(
        billRepository.findBillsByCustomerId(customerId),
      ).rejects.toThrow('Error finding bills by customer ID');
    });

    it('should handle unexpected error types', async () => {
      mockRepository.find.mockRejectedValue({
        customError: 'Custom error object',
      });
      const customerId = 1;

      await expect(
        billRepository.findBillsByCustomerId(customerId),
      ).rejects.toThrow('Error finding bills by customer ID');
    });
  });

  describe('logging behavior', () => {
    it('should log appropriate messages for successful operations', async () => {
      mockRepository.find.mockResolvedValue([testBill]);
      const customerId = 1;

      await billRepository.findBillsByCustomerId(customerId);

      expect(logger.info).toHaveBeenCalledTimes(4);
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log warning for not found cases', async () => {
      mockRepository.find.mockResolvedValue([]);
      const customerId = 999;

      await billRepository.findBillsByCustomerId(customerId);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
