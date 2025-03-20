import { GenericService } from '../../services/GenericService';
import { IRepository } from '../../repositories/IRepository';
import { getCache } from '../../utils/cacheUtil';
import logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('../../utils/cacheUtil');

// Create a test entity
class TestEntity {
  constructor(
    // eslint-disable-next-line no-unused-vars
    public id: number = 0,
    // eslint-disable-next-line no-unused-vars
    public name: string = '',
  ) {}
}

// Create a concrete implementation of GenericService for testing
class TestService extends GenericService<TestEntity> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(cache: any, repository: IRepository<TestEntity>) {
    super(cache, repository, TestEntity);
  }
}

describe('GenericService', () => {
  let testService: TestService;
  let mockRepository: jest.Mocked<IRepository<TestEntity>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCache: jest.Mocked<any>;

  const testEntity = new TestEntity(1, 'Test Entity');

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    // Create mock repository
    mockRepository = {
      createEntity: jest.fn(),
      findEntityById: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntity: jest.fn(),
      getAllEntities: jest.fn(),
      getEntitiesWithPagination: jest.fn(),
    } as jest.Mocked<IRepository<TestEntity>>;

    // Mock getCache to return our mockCache
    (getCache as jest.Mock).mockReturnValue(mockCache);

    // Create service instance
    testService = new TestService(mockCache, mockRepository);
  });

  describe('constructor', () => {
    it('should initialize service correctly', () => {
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Initialized service for testentity'),
      );
    });
  });

  describe('save', () => {
    it('should save entity and cache it successfully', async () => {
      // Arrange
      mockRepository.createEntity.mockResolvedValue(testEntity);
      mockCache.set.mockResolvedValue('OK');

      // Act
      const result = await testService.save(testEntity);

      // Assert
      expect(result).toEqual(testEntity);
      expect(mockRepository.createEntity).toHaveBeenCalledWith(testEntity);
      expect(mockCache.set).toHaveBeenCalledWith(
        'testentity:1',
        JSON.stringify(testEntity),
        3600,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cached entity'),
      );
    });

    it('should handle save failure', async () => {
      // Arrange
      mockRepository.createEntity.mockResolvedValue(null);

      // Act
      const result = await testService.save(testEntity);

      // Assert
      expect(result).toBeNull();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return cached entity if available', async () => {
      // Arrange
      mockCache.get.mockResolvedValue(JSON.stringify(testEntity));

      // Act
      const result = await testService.findById(1);

      // Assert
      expect(result).toEqual(testEntity);
      expect(mockRepository.findEntityById).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved entity from cache'),
      );
    });

    it('should fetch and cache entity if not in cache', async () => {
      // Arrange
      mockCache.get.mockResolvedValue(null);
      mockRepository.findEntityById.mockResolvedValue(testEntity);

      // Act
      const result = await testService.findById(1);

      // Assert
      expect(result).toEqual(testEntity);
      expect(mockRepository.findEntityById).toHaveBeenCalledWith(1);
      expect(mockCache.set).toHaveBeenCalledWith(
        'testentity:1',
        JSON.stringify(testEntity),
        3600,
      );
    });

    it('should handle entity not found', async () => {
      // Arrange
      mockCache.get.mockResolvedValue(null);
      mockRepository.findEntityById.mockResolvedValue(null);

      // Act
      const result = await testService.findById(1);

      // Assert
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Entity not found'),
      );
    });
  });

  describe('update', () => {
    const updateData: Partial<TestEntity> = { name: 'Updated Name' };

    it('should update entity and refresh cache', async () => {
      // Arrange
      const updatedEntity = new TestEntity(1, 'Updated Name');
      mockRepository.updateEntity.mockResolvedValue(updatedEntity);
      mockCache.set.mockResolvedValue('OK');

      // Act
      const result = await testService.update(1, updateData);

      // Assert
      expect(result).toEqual(updatedEntity);
      expect(mockRepository.updateEntity).toHaveBeenCalledWith(1, updateData);
      expect(mockCache.set).toHaveBeenCalledWith(
        'testentity:1',
        JSON.stringify(updatedEntity),
        3600,
      );
    });

    it('should handle update failure', async () => {
      // Arrange
      mockRepository.updateEntity.mockResolvedValue(null);

      // Act
      const result = await testService.update(1, updateData);

      // Assert
      expect(result).toBeNull();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete entity and remove from cache', async () => {
      // Arrange
      mockRepository.deleteEntity.mockResolvedValue(true);
      mockCache.delete.mockResolvedValue(1);

      // Act
      const result = await testService.delete(1);

      // Assert
      expect(result).toBe(true);
      expect(mockRepository.deleteEntity).toHaveBeenCalledWith(1);
      expect(mockCache.delete).toHaveBeenCalledWith('testentity:1');
    });

    it('should handle deletion failure', async () => {
      // Arrange
      mockRepository.deleteEntity.mockResolvedValue(false);

      // Act
      const result = await testService.delete(1);

      // Assert
      expect(result).toBe(false);
      expect(mockCache.delete).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should retrieve all entities and log', async () => {
      // Arrange
      const entities = [testEntity, new TestEntity(2, 'Another Entity')];
      mockRepository.getAllEntities.mockResolvedValue(entities);

      // Act
      const result = await testService.findAll();

      // Assert
      expect(result).toEqual(entities);
      expect(mockRepository.getAllEntities).toHaveBeenCalled();
      // Covers logger.info in findAll
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieving all entities for testentity'),
      );
    });

    it('should handle empty entity list', async () => {
      // Arrange
      mockRepository.getAllEntities.mockResolvedValue([]);

      // Act
      const result = await testService.findAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findWithPagination', () => {
    it('should retrieve paginated entities and log', async () => {
      // Arrange
      const entities = [testEntity, new TestEntity(2, 'Another Entity')];
      mockRepository.getEntitiesWithPagination.mockResolvedValue({
        data: entities,
        count: 2,
      });

      // Act
      const result = await testService.findWithPagination(0, 2);

      // Assert
      expect(result).toEqual({ data: entities, count: 2 });
      expect(mockRepository.getEntitiesWithPagination).toHaveBeenCalledWith(
        0,
        2,
      );
      // Covers logger.info in findWithPagination
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Fetching paginated entities: skip=0, take=2'),
      );
    });

    it('should handle zero results', async () => {
      // Arrange
      mockRepository.getEntitiesWithPagination.mockResolvedValue({
        data: [],
        count: 0,
      });

      // Act
      const result = await testService.findWithPagination(5, 5);

      // Assert
      expect(result).toEqual({ data: [], count: 0 });
      expect(mockRepository.getEntitiesWithPagination).toHaveBeenCalledWith(
        5,
        5,
      );
    });
  });
});
