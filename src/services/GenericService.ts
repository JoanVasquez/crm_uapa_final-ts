import { IRepository } from '../repositories/IRepository';
import logger from '../utils/logger';
import { ICRUD } from './ICRUD';
import { getCache } from '../utils/cacheUtil';

/**
 * 📦 GenericService - A Base Service Class for CRUD Operations
 * - Implements `ICRUD<T>` to provide a reusable service for entity operations.
 * - Uses caching for performance optimization.
 */
export abstract class GenericService<T> implements ICRUD<T> {
  private readonly entityName: string;

  /**
   * 🏗️ Constructor - Initializes the service.
   * @param cache - The caching mechanism (default: Redis).
   * @param genericRepository - The repository handling the entity's database operations.
   * @param entityClass - The entity class name.
   */
  constructor(
    //eslint-disable-next-line no-unused-vars
    protected readonly cache = getCache(),
    //eslint-disable-next-line no-unused-vars
    protected genericRepository: IRepository<T>,
    entityClass: new () => T,
  ) {
    this.entityName = entityClass.name.toLowerCase();
    logger.info(
      `✅ [GenericService] Initialized service for ${this.entityName}`,
    );
  }

  /**
   * 🆕 Saves a new entity and caches it.
   * @param entity - The entity instance to save.
   * @returns The saved entity or `null` if saving fails.
   */
  async save(entity: T): Promise<T | null> {
    logger.info(`📝 [GenericService] Saving entity: ${JSON.stringify(entity)}`);

    const savedEntity = await this.genericRepository.createEntity(entity);
    if (savedEntity) {
      // eslint-disable-next-line
      const entityId = (savedEntity as any).id;
      if (entityId) {
        await this.cache.set(
          `${this.entityName}:${entityId}`,
          JSON.stringify(savedEntity),
          3600,
        );
        logger.info(
          `✅ [GenericService] Cached entity: ${this.entityName}:${entityId}`,
        );
      }
    }

    return savedEntity;
  }

  /**
   * 🔍 Finds an entity by ID with caching support.
   * @param id - The entity ID.
   * @returns The found entity or `null` if not found.
   */
  async findById(id: number): Promise<T | null> {
    logger.info(`🔍 [GenericService] Finding entity by ID: ${id}`);

    const cacheKey = `${this.entityName}:${id}`;
    const cachedEntity = await this.cache.get(cacheKey);
    if (cachedEntity) {
      logger.info(
        `✅ [GenericService] Retrieved entity from cache: ${cacheKey}`,
      );
      return JSON.parse(cachedEntity);
    }

    const entity = await this.genericRepository.findEntityById(id);
    if (entity) {
      await this.cache.set(cacheKey, JSON.stringify(entity), 3600);
      logger.info(`✅ [GenericService] Cached entity: ${cacheKey}`);
    } else {
      logger.warn(`⚠️ [GenericService] Entity not found: ${id}`);
    }

    return entity;
  }

  /**
   * ✏️ Updates an existing entity and refreshes the cache.
   * @param id - The entity ID.
   * @param updatedData - The updated fields.
   * @returns The updated entity or `null` if update fails.
   */
  async update(id: number, updatedData: Partial<T>): Promise<T | null> {
    logger.info(
      `✏️ [GenericService] Updating entity ID: ${id} with data: ${JSON.stringify(
        updatedData,
      )}`,
    );

    const updatedEntity = await this.genericRepository.updateEntity(
      id,
      updatedData,
    );
    if (updatedEntity) {
      await this.cache.set(
        `${this.entityName}:${id}`,
        JSON.stringify(updatedEntity),
        3600,
      );
      logger.info(
        `✅ [GenericService] Updated and cached entity: ${this.entityName}:${id}`,
      );
    }

    return updatedEntity;
  }

  /**
   * 🗑️ Deletes an entity and removes it from the cache.
   * @param id - The entity ID.
   * @returns `true` if deletion was successful, otherwise `false`.
   */
  async delete(id: number): Promise<boolean> {
    logger.info(`🗑️ [GenericService] Deleting entity ID: ${id}`);

    const deleted = await this.genericRepository.deleteEntity(id);
    if (deleted) {
      await this.cache.delete(`${this.entityName}:${id}`);
      logger.info(
        `✅ [GenericService] Removed entity from cache: ${this.entityName}:${id}`,
      );
    } else {
      logger.warn(`⚠️ [GenericService] Failed to delete entity ID: ${id}`);
    }

    return deleted;
  }

  /**
   * 📋 Retrieves all entities with caching.
   * @returns A list of all entities.
   */
  async findAll(): Promise<T[]> {
    logger.info(
      `📋 [GenericService] Retrieving all entities for ${this.entityName}`,
    );

    const cacheKey = `${this.entityName}:all`;
    const cachedEntities = await this.cache.get(cacheKey);

    if (cachedEntities) {
      logger.info(
        `✅ [GenericService] Retrieved all entities from cache: ${cacheKey}`,
      );
      return JSON.parse(cachedEntities);
    }

    const entities = await this.genericRepository.getAllEntities();
    if (entities.length > 0) {
      await this.cache.set(cacheKey, JSON.stringify(entities), 3600);
      logger.info(`✅ [GenericService] Cached all entities: ${cacheKey}`);
    }

    return entities;
  }

  /**
   * 📊 Retrieves entities with pagination and caching.
   * @param skip - Number of records to skip.
   * @param take - Number of records to retrieve.
   * @returns An object containing:
   *   - `data`: The retrieved entities.
   *   - `count`: The total number of entities.
   */
  async findPaginated(
    skip: number,
    take: number,
  ): Promise<{ data: T[]; count: number }> {
    logger.info(
      `📊 [GenericService] Fetching paginated entities: skip=${skip}, take=${take}`,
    );

    const cacheKey = `${this.entityName}:pagination:skip=${skip}:take=${take}`;
    const cachedData = await this.cache.get(cacheKey);

    if (cachedData) {
      logger.info(
        `✅ [GenericService] Retrieved paginated data from cache: ${cacheKey}`,
      );
      return JSON.parse(cachedData);
    }

    const result = await this.genericRepository.getEntitiesWithPagination(
      skip,
      take,
    );
    if (result.data.length > 0) {
      await this.cache.set(cacheKey, JSON.stringify(result), 3600);
      logger.info(`✅ [GenericService] Cached paginated data: ${cacheKey}`);
    }

    return result;
  }
}
