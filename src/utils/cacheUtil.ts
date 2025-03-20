import Redis from 'ioredis';
import { RedisError } from '../errors/RedisError';
import logger from './logger';
import { getParameterDirect } from './ssmUtil';

type Environment = 'dev' | 'prod' | 'test';

// Singleton instance for the cache
let cacheInstance: Cache | null = null;

/**
 * 🔒 Cache class that wraps Redis client operations.
 */
class Cache {
  private readonly client: Redis;

  /**
   * Creates an instance of Cache.
   * @param client - The Redis client instance.
   */
  constructor(client: Redis) {
    this.client = client;
  }

  /**
   * Stores a key-value pair in the cache with a given TTL.
   * @param key - The key to set.
   * @param value - The value to store.
   * @param ttl - Time to live in seconds.
   */
  async set(key: string, value: string, ttl: number): Promise<void> {
    try {
      await this.client.set(key, value, 'EX', ttl);
      logger.info(`✅ Successfully set key: ${key}`);
    } catch (error) {
      logger.error(`❌ Redis set error for key "${key}": ${error}`);
      throw new RedisError(`Redis set error: ${error}`);
    }
  }

  /**
   * Retrieves a value by key from the cache.
   * @param key - The key to retrieve.
   * @returns The cached value or null if not found.
   */
  async get(key: string): Promise<string | null> {
    try {
      const value = await this.client.get(key);
      logger.info(`✅ Successfully retrieved key: ${key}`);
      return value;
    } catch (error) {
      logger.error(`❌ Redis get error for key "${key}": ${error}`);
      throw new RedisError(`Redis get error: ${error}`);
    }
  }

  /**
   * Deletes a key from the cache.
   * @param key - The key to delete.
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
      logger.info(`✅ Successfully deleted key: ${key}`);
    } catch (error) {
      logger.error(`❌ Redis delete error for key "${key}": ${error}`);
      throw new RedisError(`Redis delete error: ${error}`);
    }
  }
}

/**
 * Initializes and returns a singleton Cache instance.
 * 🔑 Determines the proper Redis URL based on the environment.
 *
 * @returns A promise that resolves to the Cache instance.
 * @throws {RedisError} If initialization fails.
 */
async function initCache(): Promise<Cache> {
  if (cacheInstance) {
    return cacheInstance;
  }

  try {
    // Retrieve and normalize the environment
    const env = (process.env.APP_ENV ?? '').toLowerCase() as Environment;
    let redisUrl: string | undefined;

    // 🔄 Determine the Redis endpoint based on the environment
    if (env === 'dev') {
      redisUrl = await getParameterDirect(
        process.env.SSM_REDIS_ENDPOINT_LOCAL!,
      );
    } else if (env === 'prod') {
      redisUrl = await getParameterDirect(process.env.SSM_REDIS_ENDPOINT!);
    } else if (env === 'test') {
      redisUrl = process.env.REDIS_URL_TEST;
    }

    if (!redisUrl) {
      throw new RedisError('❌ Redis URL not set in environment variables');
    }

    // 🔧 Ensure the URL starts with a valid Redis protocol
    if (
      !redisUrl.startsWith('redis://') &&
      !redisUrl.startsWith('rediss://') &&
      !redisUrl.startsWith('unix://')
    ) {
      redisUrl = `redis://${redisUrl}`;
    }

    logger.info('🔑 Initializing Redis client');

    // Create a new Redis client and verify connectivity
    const client = new Redis(redisUrl);
    await client.ping(); // 🔍 Check if Redis is reachable

    cacheInstance = new Cache(client);
    logger.info('✅ Redis client initialized successfully');
    return cacheInstance;
  } catch (error) {
    logger.error(`❌ Failed to initialize Redis: ${error}`);
    throw new RedisError(`Failed to initialize Redis: ${error}`);
  }
}

/**
 * Retrieves the singleton Cache instance.
 *
 * @returns The Cache instance.
 * @throws {RedisError} If the cache has not been initialized.
 */
function getCache(): Cache {
  if (!cacheInstance) {
    throw new RedisError(
      '❌ Cache has not been initialized. Call initCache() first.',
    );
  }
  return cacheInstance;
}

export { Cache, initCache, getCache };
