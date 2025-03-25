import { GenericService } from '../../services/GenericService';
import { IRepository } from '../../repositories/IRepository';
import { getCache } from '../../utils/cacheUtil';
import logger from '../../utils/logger';

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('../../utils/cacheUtil');

// Create a test entity class.
class TestEntity {
  constructor(
    /* eslint-disable no-unused-vars */
    public id: number = 0,
    /* eslint-disable no-unused-vars */
    public name: string = '',
  ) {}
}

// Concrete implementation of GenericService for testing.
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
    jest.clearAllMocks();

    // Create a mock cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    // Create a mock repository
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

  // -----------------------
  //  Constructor
  // -----------------------
  describe('constructor', () => {
    it('should initialize service correctly', () => {
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Initialized service for testentity'),
      );
    });
  });

  // -----------------------
  //  SAVE
  // -----------------------
  describe('save', () => {
    it('should save entity and cache it successfully', async () => {
      mockRepository.createEntity.mockResolvedValue(testEntity);
      mockCache.set.mockResolvedValue('OK');

      const result = await testService.save(testEntity);

      expect(result).toEqual(testEntity);
      expect(mockRepository.createEntity).toHaveBeenCalledWith(testEntity);
      expect(mockCache.set).toHaveBeenCalledWith(
        'testentity:1',
        JSON.stringify(testEntity),
        3600,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Cached entity: testentity:1'),
      );
    });

    it('should handle save failure by returning null', async () => {
      mockRepository.createEntity.mockResolvedValue(null);

      const result = await testService.save(testEntity);

      expect(result).toBeNull();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  // -----------------------
  //  FIND BY ID
  // -----------------------
  describe('findById', () => {
    it('should return cached entity if available', async () => {
      mockCache.get.mockResolvedValue(JSON.stringify(testEntity));

      const result = await testService.findById(1);

      expect(result).toEqual(testEntity);
      expect(mockRepository.findEntityById).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved entity from cache'),
      );
    });

    it('should fetch and cache entity if not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepository.findEntityById.mockResolvedValue(testEntity);

      const result = await testService.findById(1);

      expect(result).toEqual(testEntity);
      expect(mockRepository.findEntityById).toHaveBeenCalledWith(1);
      expect(mockCache.set).toHaveBeenCalledWith(
        'testentity:1',
        JSON.stringify(testEntity),
        3600,
      );
    });

    it('should handle entity not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepository.findEntityById.mockResolvedValue(null);

      const result = await testService.findById(1);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Entity not found'),
      );
    });
  });

  // -----------------------
  //  UPDATE
  // -----------------------
  describe('update', () => {
    const updateData: Partial<TestEntity> = { name: 'Updated Name' };

    it('should update entity and refresh cache', async () => {
      const updatedEntity = new TestEntity(1, 'Updated Name');
      mockRepository.updateEntity.mockResolvedValue(updatedEntity);
      mockCache.set.mockResolvedValue('OK');

      const result = await testService.update(1, updateData);

      expect(result).toEqual(updatedEntity);
      expect(mockRepository.updateEntity).toHaveBeenCalledWith(1, updateData);
      expect(mockCache.set).toHaveBeenCalledWith(
        'testentity:1',
        JSON.stringify(updatedEntity),
        3600,
      );
    });

    it('should handle update failure by returning null', async () => {
      mockRepository.updateEntity.mockResolvedValue(null);

      const result = await testService.update(1, updateData);

      expect(result).toBeNull();
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  // -----------------------
  //  DELETE
  // -----------------------
  describe('delete', () => {
    it('should delete entity and remove from cache', async () => {
      mockRepository.deleteEntity.mockResolvedValue(true);
      mockCache.delete.mockResolvedValue(1);

      const result = await testService.delete(1);

      expect(result).toBe(true);
      expect(mockRepository.deleteEntity).toHaveBeenCalledWith(1);
      expect(mockCache.delete).toHaveBeenCalledWith('testentity:1');
    });

    it('should handle deletion failure by returning false', async () => {
      mockRepository.deleteEntity.mockResolvedValue(false);

      const result = await testService.delete(1);

      expect(result).toBe(false);
      expect(mockCache.delete).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete entity'),
      );
    });
  });

  // -----------------------
  //  FIND ALL
  // -----------------------
  describe('findAll', () => {
    it('should retrieve all entities from repository and cache them', async () => {
      const entities = [testEntity, new TestEntity(2, 'Another Entity')];
      mockCache.get.mockResolvedValue(null);
      mockRepository.getAllEntities.mockResolvedValue(entities);

      const result = await testService.findAll();

      expect(result).toEqual(entities);
      expect(mockRepository.getAllEntities).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith(
        'testentity:all',
        JSON.stringify(entities),
        3600,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieving all entities for testentity'),
      );
    });

    // --- New test to cover cache hit branch (lines 153-156) ---
    it('should return cached entities if available in findAll', async () => {
      const cachedEntities = [testEntity, new TestEntity(2, 'Another Entity')];
      mockCache.get.mockResolvedValue(JSON.stringify(cachedEntities));

      const result = await testService.findAll();

      expect(result).toEqual(cachedEntities);
      expect(mockRepository.getAllEntities).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved all entities from cache'),
      );
    });
  });

  // -----------------------
  //  PAGINATION
  // -----------------------
  describe('findWithPagination', () => {
    it('should retrieve paginated entities from repository and cache them', async () => {
      const entities = [testEntity, new TestEntity(2, 'Another Entity')];
      mockCache.get.mockResolvedValue(null);
      mockRepository.getEntitiesWithPagination.mockResolvedValue({
        data: entities,
        count: 2,
      });

      const result = await testService.findWithPagination(0, 2);

      expect(result).toEqual({ data: entities, count: 2 });
      expect(mockRepository.getEntitiesWithPagination).toHaveBeenCalledWith(
        0,
        2,
      );
      expect(mockCache.set).toHaveBeenCalledWith(
        'testentity:pagination:skip=0:take=2',
        JSON.stringify({ data: entities, count: 2 }),
        3600,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Fetching paginated entities: skip=0, take=2'),
      );
    });

    // --- New test to cover cache hit branch (lines 188-191) ---
    it('should return cached paginated data if available', async () => {
      const paginatedResult = { data: [testEntity], count: 1 };
      const cacheKey = 'testentity:pagination:skip=0:take=2';
      mockCache.get.mockResolvedValue(JSON.stringify(paginatedResult));

      const result = await testService.findWithPagination(0, 2);

      expect(result).toEqual(paginatedResult);
      expect(mockRepository.getEntitiesWithPagination).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `Retrieved paginated data from cache: ${cacheKey}`,
        ),
      );
    });
  });
});
