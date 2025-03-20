import { DataSource } from 'typeorm';
import { User } from '../models/User';
import logger from '../utils/logger';
import { GenericRepository } from './GenericRepository';
import { inject, injectable } from 'tsyringe';
import { BaseAppException } from '../errors/BaseAppException';

/**
 * 📦 UserRepository - Handles database operations related to the `User` entity.
 * - Extends `GenericRepository<User>` to inherit standard CRUD operations.
 * - Implements custom queries such as `findUserByUsername`.
 */
@injectable()
export class UserRepository extends GenericRepository<User> {
  /**
   * 🏗️ Constructor - Injects the TypeORM `DataSource` instance.
   * @param dataSource - The database connection instance.
   */
  constructor(@inject('DataSourceToken') dataSource: DataSource) {
    super(dataSource, User);
    logger.info('✅ [UserRepository] Initialized UserRepository');
  }

  /**
   * 🔍 Finds a user by their username.
   * @param username - The username to search for.
   * @returns A promise resolving to the `User` entity or `null` if not found.
   */
  async findUserByUsername(username: string): Promise<User | null> {
    try {
      logger.info(
        `🔍 [UserRepository] Searching for user with username: ${username}`,
      );

      const user = await this.repo.findOneBy({ username });

      if (!user) {
        logger.warn(
          `⚠️ [UserRepository] No user found with username: ${username}`,
        );
        return null;
      }

      logger.info(`✅ [UserRepository] Found user with username: ${username}`);
      return user;
    } catch (error) {
      logger.error(`❌ [UserRepository] Error finding user by username:`, {
        error,
      });
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BaseAppException(
        `Error finding user by username: ${errorMessage}`,
      );
    }
  }
}
