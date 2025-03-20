import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../../models/User';
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
import { UserRepository } from '../../repositories/UserRepository';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRepository: jest.Mocked<Repository<User>>;

  const testUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
    email: 'test@example.com',
    is_active: true,
    role: UserRole.ADMIN,
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
    } as unknown as jest.Mocked<Repository<User>>;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as unknown as jest.Mocked<DataSource>;

    // Create UserRepository instance
    userRepository = new UserRepository(mockDataSource);
  });

  describe('constructor', () => {
    it('should initialize repository correctly', () => {
      expect(mockDataSource.getRepository).toHaveBeenCalledWith(User);
      expect(logger.info).toHaveBeenCalledWith(
        '✅ [UserRepository] Initialized UserRepository',
      );
    });
  });

  describe('findUserByUsername', () => {
    it('should find user by username successfully', async () => {
      // Arrange
      mockRepository.findOneBy.mockResolvedValue(testUser);
      const username = 'testuser';

      // Act
      const result = await userRepository.findUserByUsername(username);

      // Assert
      expect(result).toEqual(testUser);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ username });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `Searching for user with username: ${username}`,
        ),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Found user with username: ${username}`),
      );
    });

    it('should return null when user is not found', async () => {
      // Arrange
      mockRepository.findOneBy.mockResolvedValue(null);
      const username = 'nonexistentuser';

      // Act
      const result = await userRepository.findUserByUsername(username);

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ username });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining(`No user found with username: ${username}`),
      );
    });

    it('should throw error when database query fails', async () => {
      // Arrange
      const errorMessage = 'Database connection failed';
      mockRepository.findOneBy.mockRejectedValue(new Error(errorMessage));
      const username = 'testuser';

      // Act & Assert
      await expect(userRepository.findUserByUsername(username)).rejects.toThrow(
        `Error finding user by username: ${errorMessage}`,
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ [UserRepository] Error finding user by username:',
        expect.objectContaining({ error: expect.any(Error) }),
      );
    });

    it('should handle non-Error objects in catch block', async () => {
      // Arrange
      mockRepository.findOneBy.mockRejectedValue('Some non-error object');
      const username = 'testuser';

      // Act & Assert
      await expect(userRepository.findUserByUsername(username)).rejects.toThrow(
        'Error finding user by username: Unknown error',
      );
      expect(logger.error).toHaveBeenCalledWith(
        '❌ [UserRepository] Error finding user by username:',
        expect.objectContaining({ error: 'Some non-error object' }),
      );
    });
  });

  describe('inherited methods', () => {
    it('should inherit CRUD operations from GenericRepository', () => {
      // Verify that UserRepository has inherited methods
      expect(userRepository.createEntity).toBeDefined();
      expect(userRepository.findEntityById).toBeDefined();
      expect(userRepository.updateEntity).toBeDefined();
      expect(userRepository.deleteEntity).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockRepository.findOneBy.mockRejectedValue(
        new Error('Connection refused'),
      );
      const username = 'testuser';

      // Act & Assert
      await expect(userRepository.findUserByUsername(username)).rejects.toThrow(
        'Error finding user by username: Connection refused',
      );
    });

    it('should handle unexpected error types', async () => {
      // Arrange
      mockRepository.findOneBy.mockRejectedValue({
        customError: 'Custom error object',
      });
      const username = 'testuser';

      // Act & Assert
      await expect(userRepository.findUserByUsername(username)).rejects.toThrow(
        'Error finding user by username: Unknown error',
      );
    });
  });

  describe('logging behavior', () => {
    it('should log appropriate messages for successful operations', async () => {
      // Arrange
      mockRepository.findOneBy.mockResolvedValue(testUser);
      const username = 'testuser';

      // Act
      await userRepository.findUserByUsername(username);

      // Assert
      expect(logger.info).toHaveBeenCalledTimes(4); // Search start and success
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should log warning for not found cases', async () => {
      // Arrange
      mockRepository.findOneBy.mockResolvedValue(null);
      const username = 'nonexistentuser';

      // Act
      await userRepository.findUserByUsername(username);

      // Assert
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});
