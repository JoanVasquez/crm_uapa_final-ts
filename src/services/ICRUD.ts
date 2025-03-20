/**
 * 📦 ICRUD - Generic CRUD Interface
 * - Defines the contract for implementing basic CRUD operations.
 * - Ensures consistency across services handling different entities.
 */
export interface ICRUD<T> {
  /**
   * 🆕 Saves a new entity in the database.
   * @param entity - The entity instance to save.
   * @returns A promise resolving to the saved entity or `null` if creation fails.
   */
  // eslint-disable-next-line no-unused-vars
  save(entity: T): Promise<T | null>;

  /**
   * 🔍 Finds an entity by its unique ID.
   * @param id - The entity ID.
   * @returns A promise resolving to the found entity or `null` if not found.
   */
  // eslint-disable-next-line no-unused-vars
  findById(id: number): Promise<T | null>;

  /**
   * ✏️ Updates an existing entity by ID.
   * @param id - The entity ID.
   * @param updatedData - The fields to update in the entity.
   * @returns A promise resolving to the updated entity or `null` if update fails.
   */
  // eslint-disable-next-line no-unused-vars
  update(id: number, updatedData: Partial<T>): Promise<T | null>;

  /**
   * 🗑️ Deletes an entity by ID.
   * @param id - The entity ID.
   * @returns A promise resolving to `true` if deletion was successful, otherwise `false`.
   */
  // eslint-disable-next-line no-unused-vars
  delete(id: number): Promise<boolean>;

  /**
   * 📋 Retrieves all entities from the database.
   * @returns A promise resolving to an array of all entities.
   */
  findAll(): Promise<T[]>;

  /**
   * 📊 Retrieves entities with pagination support.
   * @param skip - The number of records to skip.
   * @param take - The number of records to retrieve.
   * @returns A promise resolving to an object containing:
   *   - `data`: The retrieved entities.
   *   - `count`: The total number of entities in the database.
   */
  findWithPagination(
    // eslint-disable-next-line no-unused-vars
    skip: number,
    // eslint-disable-next-line no-unused-vars
    take: number,
  ): Promise<{ data: T[]; count: number }>;
}
