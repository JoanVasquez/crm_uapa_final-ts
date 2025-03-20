import { DataSource, ObjectLiteral, Repository } from 'typeorm';
import { IRepository } from './IRepository';
import logger from '../utils/logger';
import { DatabaseError } from '../errors/DatabaseError';
import { NotFoundError } from '../errors/NotFoundError';

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
        `✅ [GenericRepository] Created new entity: ${JSON.stringify(
          savedEntity,
        )}`,
      );
      return savedEntity;
    } catch (error: unknown) {
      logger.error(`❌ [GenericRepository] Error creating entity:`, { error });
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new DatabaseError('Error creating entity', errorMessage);
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
        logger.error(
          `❌ [GenericRepository] Entity with ID ${id} not found for update`,
        );
        throw new NotFoundError('Entity');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedEntity = await this.repo.findOneBy({ id } as any);
      if (!updatedEntity) {
        logger.error(
          `❌ [GenericRepository] Entity with ID ${id} not found after update`,
        );
        throw new NotFoundError('Entity');
      }

      logger.info(`✅ [GenericRepository] Updated entity with ID: ${id}`);
      return updatedEntity;
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`❌ [GenericRepository] Error updating entity:`, { error });
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
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
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error(`❌ [GenericRepository] Error deleting entity:`, { error });
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

  /**
   * 📊 Retrieves entities with pagination.
   *
   * @param skip - Number of records to skip.
   * @param take - Number of records to retrieve.
   * @returns An object containing the paginated data and total count.
   */
  async getEntitiesWithPagination(
    skip: number,
    take: number,
  ): Promise<{ data: T[]; count: number }> {
    try {
      const [data, count] = await this.repo.findAndCount({ skip, take });
      logger.info(
        `✅ [GenericRepository] Retrieved ${data.length} records (Page size: ${take})`,
      );
      return { data, count };
    } catch (error) {
      logger.error(
        `❌ [GenericRepository] Error fetching paginated entities:`,
        { error },
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
