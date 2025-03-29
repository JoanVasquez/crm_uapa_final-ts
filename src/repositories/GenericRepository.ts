import { DataSource, ObjectLiteral, Repository } from 'typeorm';
import util from 'util';
import { IRepository } from './IRepository';
import logger from '../utils/logger';
import { DatabaseError } from '../errors/DatabaseError';
import { NotFoundError } from '../errors/NotFoundError';
import { DuplicateRecordError } from '../errors/DuplicateRecordError';
import { ForeignKeyViolationError } from '../errors/ForeignKeyViolationError';

/**
 * 📦 GenericRepository
 * - Provides a reusable, abstract repository for handling CRUD operations in TypeORM.
 * - Implements `IRepository<T>` for consistency.
 * - Logs all operations for debugging and monitoring.
 */
export abstract class GenericRepository<T extends ObjectLiteral>
  implements IRepository<T>
{
  protected repo: Repository<T>;

  /**
   * 🏗️ Initializes the repository for a specific entity.
   *
   * @param datasource - The TypeORM DataSource instance.
   * @param entityClass - The entity class for which this repository is created.
   */
  constructor(datasource: DataSource, entityClass: new () => T) {
    this.repo = datasource.getRepository(entityClass);
    logger.info(
      `✅ [GenericRepository] Initialized repository for ${entityClass.name}`,
    );
  }

  /**
   * 🆕 Creates and saves a new entity.
   *
   * @param entity - The entity instance to save.
   * @returns The saved entity or throws an error.
   */
  async createEntity(entity: T): Promise<T | null> {
    try {
      const savedEntity = await this.repo.save(entity);
      logger.info(
        `✅ [GenericRepository] Created new entity: ${util.inspect(
          savedEntity,
          {
            depth: null,
            colors: false,
          },
        )}`,
      );
      return savedEntity;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);

      logger.error(
        `❌ [GenericRepository] Error creating entity: ${errorMessage}`,
        error instanceof Error ? { stack: error.stack } : { error },
      );

      // 🎯 Handle specific errors (Duplicate or Foreign Key Violation)
      if (error.code === '23505') {
        throw new DuplicateRecordError('Duplicated record');
      } else if (error.code === '23503') {
        throw new ForeignKeyViolationError('Foreign key violation');
      }

      throw new DatabaseError('Error creating entity', errorMessage); // ✅ Now passing correct error metadata
    }
  }

  /**
   * 🔍 Finds an entity by ID.
   *
   * @param id - The entity ID.
   * @returns The found entity or throws a NotFoundError.
   */
  async findEntityById(id: number): Promise<T | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entity = await this.repo.findOneBy({ id } as any);

      if (!entity) {
        logger.warn(`⚠️ [GenericRepository] Entity with ID ${id} not found`);
        throw new NotFoundError('Entity');
      }

      logger.info(`✅ [GenericRepository] Retrieved entity with ID: ${id}`);
      return entity;
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`❌ [GenericRepository] Error finding entity:`, { error });
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError('Error finding entity', errorMessage);
    }
  }

  /**
   * ✏️ Updates an entity by ID.
   *
   * @param id - The entity ID.
   * @param updatedData - The updated fields.
   * @returns The updated entity or throws an error.
   */
  async updateEntity(id: number, updatedData: Partial<T>): Promise<T | null> {
    try {
      const updateResult = await this.repo.update(id, updatedData);

      if (updateResult.affected === 0) {
        logger.warn(
          `❌ [GenericRepository] Entity with ID ${id} not found for update`,
        );
        throw new NotFoundError('Entity');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedEntity = await this.repo.findOneBy({ id } as any);
      if (!updatedEntity) {
        logger.warn(
          `⚠️ [GenericRepository] Entity with ID ${id} not found after update`,
        );
        throw new NotFoundError('Entity');
      }

      logger.info(`✅ [GenericRepository] Updated entity with ID: ${id}`);
      return updatedEntity;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error(`❌ [GenericRepository] Error updating entity:`, { error });
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      if (error.code === '23505') {
        throw new DuplicateRecordError('Duplicated record');
      }

      throw new DatabaseError('Error updating entity', errorMessage);
    }
  }

  /**
   * 🗑️ Deletes an entity by ID.
   *
   * @param id - The entity ID.
   * @returns `true` if deletion was successful, otherwise throws an error.
   */
  async deleteEntity(id: number): Promise<boolean> {
    try {
      const result = await this.repo.delete(id);

      if (result.affected === 0) {
        logger.warn(
          `⚠️ [GenericRepository] Entity with ID ${id} not found for deletion`,
        );
        throw new NotFoundError('Entity');
      }

      logger.info(`✅ [GenericRepository] Deleted entity with ID: ${id}`);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      logger.error(`❌ [GenericRepository] Error deleting entity:`, { error });

      if (error.code === '23503') {
        throw new ForeignKeyViolationError(
          'Cannot delete entity due to foreign key constraints',
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError('Error deleting entity', errorMessage);
    }
  }

  /**
   * 📋 Retrieves all entities.
   *
   * @returns An array of all entities or throws an error.
   */
  async getAllEntities(): Promise<T[]> {
    try {
      const entities = await this.repo.find();
      logger.info(
        `✅ [GenericRepository] Retrieved all entities: ${entities.length} records`,
      );
      return entities;
    } catch (error) {
      logger.error(`❌ [GenericRepository] Error fetching all entities:`, {
        error,
      });
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError('Error fetching all entities', errorMessage);
    }
  }

  async getEntitiesWithPagination(
    page: number,
    perPage: number,
  ): Promise<{ data: T[]; count: number }> {
    try {
      const skip = (page - 1) * perPage;
      const take = perPage;

      const [data, count] = await this.repo.findAndCount({ skip, take });

      logger.info(
        `✅ [GenericRepository] Retrieved ${data.length} records (Page: ${page}, PerPage: ${perPage})`,
      );

      return { data, count };
    } catch (error) {
      logger.error(
        `❌ [GenericRepository] Error fetching paginated entities:`,
        {
          error,
        },
      );

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      throw new DatabaseError(
        'Error fetching paginated entities',
        errorMessage,
      );
    }
  }
}
