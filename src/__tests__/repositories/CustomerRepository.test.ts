import { DataSource, Repository } from 'typeorm';
import { Customer } from '../../models/Customer';
import { CustomerRepository } from '../../repositories/CustomerRepository';
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

describe('CustomerRepository', () => {
  let customerRepository: CustomerRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRepository: jest.Mocked<Repository<Customer>>;

  const testCustomer: Customer = {
    id: 1,
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    address: '123 Main St',
    phonenumber: '555-1234',
    bills: [],
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
    } as unknown as jest.Mocked<Repository<Customer>>;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as unknown as jest.Mocked<DataSource>;

    // Create CustomerRepository instance
    customerRepository = new CustomerRepository(mockDataSource);
  });

  describe('constructor', () => {
    it('should initialize repository correctly', () => {
      expect(mockDataSource.getRepository).toHaveBeenCalledWith(Customer);
      expect(logger.info).toHaveBeenCalledWith(
        '✅ [CustomerRepository] Initialized CustomerRepository',
      );
    });
  });

  describe('findCustomerByEmail', () => {
    it('should find customer by email successfully', async () => {
      // Arrange
      mockRepository.findOneBy.mockResolvedValue(testCustomer);
      const email = 'test@example.com';

      // Act
      const result = await customerRepository.findCustomerByEmail(email);

      // Assert
      expect(result).toEqual(testCustomer);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Searching for customer with email: ${email}`),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Found customer with email: ${email}`),
      );
    });

    it('should return null when customer is not found', async () => {
      // Arrange
      mockRepository.findOneBy.mockResolvedValue(null);
      const email = 'nonexistent@example.com';

      // Act
      const result = await customerRepository.findCustomerByEmail(email);

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(`No customer found with email: ${email}`),
      );
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockRepository.findOneBy.mockRejectedValue(new Error(errorMessage));
      const email = 'test@example.com';

      // Act & Assert
      await expect(
        customerRepository.findCustomerByEmail(email),
      ).rejects.toThrow('Error finding customer by email');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ [CustomerRepository] Error finding customer by email:',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('should handle non-Error objects in catch block', async () => {
      // Arrange
      mockRepository.findOneBy.mockRejectedValue('Some non-error object');
      const email = 'test@example.com';

      // Act & Assert
      await expect(
        customerRepository.findCustomerByEmail(email),
      ).rejects.toThrow('Error finding customer by email');
      expect(logger.error).toHaveBeenCalledWith(
        '❌ [CustomerRepository] Error finding customer by email:',
        expect.objectContaining({ error: 'Some non-error object' }),
      );
    });
  });

  describe('inherited methods', () => {
    it('should inherit CRUD operations from GenericRepository', () => {
      expect(customerRepository.createEntity).toBeDefined();
      expect(customerRepository.findEntityById).toBeDefined();
      expect(customerRepository.updateEntity).toBeDefined();
      expect(customerRepository.deleteEntity).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      mockRepository.findOneBy.mockRejectedValue(
        new Error('Connection refused'),
      );
      const email = 'test@example.com';

      await expect(
        customerRepository.findCustomerByEmail(email),
      ).rejects.toThrow('Error finding customer by email');
    });

    it('should handle unexpected error types', async () => {
      mockRepository.findOneBy.mockRejectedValue({
        customError: 'Custom error object',
      });
      const email = 'test@example.com';

      await expect(
        customerRepository.findCustomerByEmail(email),
      ).rejects.toThrow('Error finding customer by email');
    });
  });

  describe('logging behavior', () => {
    it('should log appropriate messages for successful operations', async () => {
      mockRepository.findOneBy.mockResolvedValue(testCustomer);
      const email = 'test@example.com';

      await customerRepository.findCustomerByEmail(email);

      expect(logger.info).toHaveBeenCalledTimes(4);
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log warning for not found cases', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      const email = 'nonexistent@example.com';

      await customerRepository.findCustomerByEmail(email);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
