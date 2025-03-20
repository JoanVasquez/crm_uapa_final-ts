import Redis from 'ioredis';
import logger from '../../utils/logger';
import { getParameterDirect } from '../../utils/ssmUtil'; // This one is fine to keep

import { RedisError } from '../../errors/RedisError'; // If you throw RedisError in your test, you can keep this import.
// If you re-import RedisError from cacheUtil again, you must remove this and do dynamic import as well.

// Mock dependencies
jest.mock('ioredis');
jest.mock('../../utils/logger');
jest.mock('../../utils/ssmUtil', () => ({
  getParameterDirect: jest.fn(),
}));

describe('Cache', () => {
  let mockRedisClient: jest.Mocked<Redis>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let CacheClass: any; // Will hold the dynamic import of `Cache`
  let initCache: Function; // Will hold the dynamic import of `initCache`
  let getCache: Function; // Will hold the dynamic import of `getCache`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let RedisErrorClass: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a mock Redis client
    mockRedisClient = new Redis() as jest.Mocked<Redis>;
  });

  describe('Cache class methods', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cache: any;

    // For these, you don't need to reset modules each time, because you’re just
    // testing the class directly. But if you do, also do dynamic import.
    beforeEach(() => {
      // Pull in the Cache class for direct testing
      const { Cache } = require('../../utils/cacheUtil');
      CacheClass = Cache;
      cache = new CacheClass(mockRedisClient);
    });

    describe('set', () => {
      it('should successfully set a value in cache', async () => {
        mockRedisClient.set.mockResolvedValue('OK');

        await cache.set('testKey', 'testValue', 3600);

        expect(mockRedisClient.set).toHaveBeenCalledWith(
          'testKey',
          'testValue',
          'EX',
          3600,
        );
        expect(logger.info).toHaveBeenCalled();
      });

      it('should throw RedisError when set fails', async () => {
        const error = new Error('Redis connection failed');
        mockRedisClient.set.mockRejectedValue(error);

        await expect(cache.set('testKey', 'testValue', 3600)).rejects.toThrow(
          RedisError,
        );
        expect(logger.error).toHaveBeenCalled();
      });
    });

    describe('get', () => {
      it('should successfully get a value from cache', async () => {
        mockRedisClient.get.mockResolvedValue('testValue');

        const result = await cache.get('testKey');

        expect(result).toBe('testValue');
        expect(mockRedisClient.get).toHaveBeenCalledWith('testKey');
        expect(logger.info).toHaveBeenCalled();
      });

      it('should return null for non-existent key', async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await cache.get('nonExistentKey');
        expect(result).toBeNull();
        expect(logger.info).toHaveBeenCalled();
      });

      it('should throw RedisError when get fails', async () => {
        const error = new Error('Redis connection failed');
        mockRedisClient.get.mockRejectedValue(error);

        await expect(cache.get('testKey')).rejects.toThrow(RedisError);
        expect(logger.error).toHaveBeenCalled();
      });
    });

    describe('delete', () => {
      it('should successfully delete a key from cache', async () => {
        mockRedisClient.del.mockResolvedValue(1);

        await cache.delete('testKey');

        expect(mockRedisClient.del).toHaveBeenCalledWith('testKey');
        expect(logger.info).toHaveBeenCalled();
      });

      it('should throw RedisError when delete fails', async () => {
        const error = new Error('Redis connection failed');
        mockRedisClient.del.mockRejectedValue(error);

        await expect(cache.delete('testKey')).rejects.toThrow(RedisError);
        expect(logger.error).toHaveBeenCalled();
      });
    });
  });

  describe('initCache', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
      delete process.env.APP_ENV;
      delete process.env.SSM_REDIS_ENDPOINT_LOCAL;
      delete process.env.REDIS_URL_TEST;
    });

    it('should throw error when Redis URL is not set', async () => {
      // Arrange
      process.env.APP_ENV = 'dev';

      // Force getParameterDirect to return undefined => no redisUrl
      (getParameterDirect as jest.Mock).mockResolvedValueOnce(undefined);

      // Re-import
      const cacheModule = require('../../utils/cacheUtil');
      initCache = cacheModule.initCache;
      CacheClass = cacheModule.Cache;

      // Import the same RedisError your code uses:
      // (Since your cacheUtil imports RedisError from '../../errors/RedisError',
      // we do the exact same dynamic import here. That ensures the references match.)
      const errorModule = require('../../errors/RedisError');
      RedisErrorClass = errorModule.RedisError;

      // Act & Assert
      await expect(initCache()).rejects.toThrow(RedisErrorClass);
      //            ^^^^^^^^^^^^^^^^^^^^^^^^^^
      // Must check *this* reference to RedisError, not a top-level import
    });
  });

  describe('getCache', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
      delete process.env.APP_ENV;
      delete process.env.SSM_REDIS_ENDPOINT_LOCAL;
      delete process.env.REDIS_URL_TEST;
    });

    it('should return cache instance when initialized', async () => {
      process.env.APP_ENV = 'test';
      process.env.REDIS_URL_TEST = 'redis://localhost:6379';

      const mockPing = jest.fn().mockResolvedValue('PONG');
      (Redis as jest.MockedClass<typeof Redis>).prototype.ping = mockPing;

      const cacheModule = require('../../utils/cacheUtil');
      initCache = cacheModule.initCache;
      getCache = cacheModule.getCache;
      CacheClass = cacheModule.Cache;

      await initCache();
      const c = getCache();
      expect(c).toBeInstanceOf(CacheClass);
    });
  });
});
