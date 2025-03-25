import { DataSource, Repository, ObjectLiteral, DeleteResult } from 'typeorm';
import { GenericRepository } from '../../repositories/GenericRepository';
import { DatabaseError } from '../../errors/DatabaseError';
import { NotFoundError } from '../../errors/NotFoundError';
import logger from '../../utils/logger';

// Ensure logger methods are jest functions.
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
}));

// Create a test entity class.
class TestEntity implements ObjectLiteral {
  id!: number;
  name!: string;
}

// Concrete repository implementation for testing.
class TestRepository extends GenericRepository<TestEntity> {
  constructor(dataSource: DataSource) {
    super(dataSource, TestEntity);
  }
}

describe('GenericRepository', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockRepository: jest.Mocked<Repository<TestEntity>>;
  let testRepository: TestRepository;

  const testEntity: TestEntity = { id: 1, name: 'Test Entity' };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock repository with all needed methods.
    mockRepository = {
      save: jest.fn(),
      findOneBy: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<TestEntity>>;

    // Create a mock DataSource that returns our mock repository.
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    } as unknown as jest.Mocked<DataSource>;

    // Create an instance of TestRepository.
    testRepository = new TestRepository(mockDataSource);
  });

  // -----------------------
  //  Constructor
  // -----------------------
  it('should initialize and log repository creation', () => {
    expect(mockDataSource.getRepository).toHaveBeenCalledWith(TestEntity);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(`Initialized repository for ${TestEntity.name}`),
    );
  });

  // -----------------------
  //  CREATE
  // -----------------------
  describe('createEntity', () => {
    it('should successfully create an entity', async () => {
      mockRepository.save.mockResolvedValue(testEntity);

      const result = await testRepository.createEntity(testEntity);

      expect(result).toEqual(testEntity);
      expect(mockRepository.save).toHaveBeenCalledWith(testEntity);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(testEntity)),
      );
    });

    it('should throw DatabaseError when save fails with an Error', async () => {
      const error = new Error('Save failed');
      mockRepository.save.mockRejectedValue(error);

      await expect(testRepository.createEntity(testEntity)).rejects.toThrow(
        DatabaseError,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error creating entity:'),
        { error },
      );
    });

    it('should throw DatabaseError with JSON stringified metadata when save fails with non-Error', async () => {
      const plainError = { unexpected: true };
      mockRepository.save.mockRejectedValue(plainError);

      try {
        await testRepository.createEntity(testEntity);
        // Fail the test if no error is thrown.
        throw new Error('Test did not throw');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(DatabaseError);
        if (err instanceof DatabaseError) {
          expect(err.metadata).toEqual('Unknown error');
        }
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // -----------------------
  //  READ BY ID
  // -----------------------
  describe('findEntityById', () => {
    it('should successfully find an entity by id', async () => {
      mockRepository.findOneBy.mockResolvedValue(testEntity);

      const result = await testRepository.findEntityById(1);

      expect(result).toEqual(testEntity);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved entity with ID: 1'),
      );
    });

    it('should throw NotFoundError when entity does not exist', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(testRepository.findEntityById(1)).rejects.toThrow(
        NotFoundError,
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Entity with ID 1 not found'),
      );
    });

    it('should throw DatabaseError when find operation fails with an Error', async () => {
      const error = new Error('Find failed');
      mockRepository.findOneBy.mockRejectedValue(error);

      await expect(testRepository.findEntityById(1)).rejects.toThrow(
        DatabaseError,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error finding entity:'),
        { error },
      );
    });

    it('should throw DatabaseError with JSON stringified metadata when find operation fails with non-Error', async () => {
      const plainError = { unexpected: 'fail' };
      mockRepository.findOneBy.mockRejectedValue(plainError);

      try {
        await testRepository.findEntityById(1);
        throw new Error('Test did not throw');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(DatabaseError);
        if (err instanceof DatabaseError) {
          expect(err.metadata).toEqual('Unknown error');
        }
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // -----------------------
  //  UPDATE
  // -----------------------
  describe('updateEntity', () => {
    const updateData: Partial<TestEntity> = { name: 'Updated Name' };

    it('should successfully update an entity', async () => {
      const updatedEntity = { ...testEntity, ...updateData };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOneBy.mockResolvedValue(updatedEntity);

      const result = await testRepository.updateEntity(1, updateData);

      expect(result).toEqual(updatedEntity);
      expect(mockRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Updated entity with ID: 1'),
      );
    });

    it('should throw NotFoundError when update affects 0 rows', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockRepository.update.mockResolvedValue({ affected: 0 } as any);

      await expect(testRepository.updateEntity(1, updateData)).rejects.toThrow(
        NotFoundError,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Entity with ID 1 not found for update'),
      );
    });

    it('should throw NotFoundError when entity not found after update', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockRepository.update.mockResolvedValue({ affected: 1 } as any);
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(testRepository.updateEntity(1, updateData)).rejects.toThrow(
        NotFoundError,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Entity with ID 1 not found after update'),
      );
    });

    it('should throw DatabaseError when update fails with an Error', async () => {
      const error = new Error('Update failed');
      mockRepository.update.mockRejectedValue(error);

      await expect(testRepository.updateEntity(1, updateData)).rejects.toThrow(
        DatabaseError,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error updating entity:'),
        { error },
      );
    });

    it('should throw DatabaseError with JSON stringified metadata when update fails with non-Error', async () => {
      const plainError = { reason: 'bad update' };
      mockRepository.update.mockRejectedValue(plainError);

      try {
        await testRepository.updateEntity(1, updateData);
        throw new Error('Test did not throw');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(DatabaseError);
        if (err instanceof DatabaseError) {
          expect(err.metadata).toEqual('Unknown error');
        }
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // -----------------------
  //  DELETE
  // -----------------------
  describe('deleteEntity', () => {
    it('should successfully delete an entity', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 } as DeleteResult);

      const result = await testRepository.deleteEntity(1);

      expect(result).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Deleted entity with ID: 1'),
      );
    });

    it('should throw NotFoundError when entity does not exist', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 } as DeleteResult);

      await expect(testRepository.deleteEntity(1)).rejects.toThrow(
        NotFoundError,
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Entity with ID 1 not found for deletion'),
      );
    });

    it('should throw DatabaseError when delete fails with an Error', async () => {
      const error = new Error('Delete failed');
      mockRepository.delete.mockRejectedValue(error);

      await expect(testRepository.deleteEntity(1)).rejects.toThrow(
        DatabaseError,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error deleting entity:'),
        { error },
      );
    });

    it('should throw DatabaseError with JSON stringified metadata when delete fails with non-Error', async () => {
      const plainError = { unexpected: 'delete' };
      mockRepository.delete.mockRejectedValue(plainError);

      try {
        await testRepository.deleteEntity(1);
        throw new Error('Test did not throw');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(DatabaseError);
        if (err instanceof DatabaseError) {
          expect(err.metadata).toEqual('Unknown error');
        }
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // -----------------------
  //  GET ALL
  // -----------------------
  describe('getAllEntities', () => {
    it('should retrieve all entities', async () => {
      const entities = [testEntity, { ...testEntity, id: 2 }];
      mockRepository.find.mockResolvedValue(entities);

      const result = await testRepository.getAllEntities();

      expect(result).toEqual(entities);
      expect(mockRepository.find).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `Retrieved all entities: ${entities.length} records`,
        ),
      );
    });

    it('should throw DatabaseError when find fails with an Error', async () => {
      const error = new Error('Find all failed');
      mockRepository.find.mockRejectedValue(error);

      await expect(testRepository.getAllEntities()).rejects.toThrow(
        DatabaseError,
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching all entities:'),
        { error },
      );
    });

    it('should throw DatabaseError with JSON stringified metadata when find fails with non-Error', async () => {
      const plainError = { unexpected: 'find' };
      mockRepository.find.mockRejectedValue(plainError);

      try {
        await testRepository.getAllEntities();
        throw new Error('Test did not throw');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(DatabaseError);
        if (err instanceof DatabaseError) {
          expect(err.metadata).toEqual('Unknown error');
        }
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });

  // -----------------------
  //  PAGINATION
  // -----------------------
  describe('getEntitiesWithPagination', () => {
    it('should retrieve paginated entities', async () => {
      const entities = [testEntity, { ...testEntity, id: 2 }];
      mockRepository.findAndCount.mockResolvedValue([entities, 2]);

      const skip = 0;
      const take = 2;
      const result = await testRepository.getEntitiesWithPagination(skip, take);

      expect(result).toEqual({ data: entities, count: 2 });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({ skip, take });
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `Retrieved ${entities.length} records (Page size: ${take})`,
        ),
      );
    });

    it('should throw DatabaseError when findAndCount fails with an Error', async () => {
      const error = new Error('Find and count failed');
      mockRepository.findAndCount.mockRejectedValue(error);

      await expect(
        testRepository.getEntitiesWithPagination(0, 2),
      ).rejects.toThrow(DatabaseError);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error fetching paginated entities:'),
        { error },
      );
    });

    it('should throw DatabaseError with JSON stringified metadata when findAndCount fails with non-Error', async () => {
      const plainError = { unexpected: 'pagination' };
      mockRepository.findAndCount.mockRejectedValue(plainError);

      try {
        await testRepository.getEntitiesWithPagination(0, 2);
        throw new Error('Test did not throw');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(DatabaseError);
        if (err instanceof DatabaseError) {
          expect(err.metadata).toEqual('Unknown error');
        }
      }
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
