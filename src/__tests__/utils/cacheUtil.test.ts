/**
 * cacheUtil.test.ts
 *
 * A single file covering all lines in `cacheUtil.ts`.
 */

// We'll only import your logger & SSM mocks at the top
// and define `createMockRedisClient` with `redis-mock`.

import logger from '../../utils/logger';
import { getParameterDirect } from '../../utils/ssmUtil';
import RedisMock from 'redis-mock';
import { promisify } from 'util';

///////////////////////////////////////////////////////////////////
// 1) A helper to build a redis-mock client you can override/ping
///////////////////////////////////////////////////////////////////
function createMockRedisClient() {
  const mock = RedisMock.createClient();
  return {
    set: promisify(mock.set).bind(mock),
    get: promisify(mock.get).bind(mock),
    del: promisify(mock.del).bind(mock),
    expire: promisify(mock.expire).bind(mock),
    quit: async () => 'OK',
    disconnect: () => {},
    // We'll define .ping inside each test if needed
  };
}

jest.mock('../../utils/logger');
jest.mock('../../utils/ssmUtil');

///////////////////////////////////////////////////////////////////
// 2) Unit tests for the Cache class (set/get/delete/TTL).
///////////////////////////////////////////////////////////////////
describe('Cache Class - Unit Tests', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let CacheClass: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cache: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRedisClient: any;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();

    // We'll mock ioredis AFTER modules reset, so that any new import sees the mock
    jest.mock('ioredis', () => {
      const Redis = jest.fn();
      // By default, return an empty object so we can shape it in each test
      Redis.mockImplementation(() => ({}));
      return { __esModule: true, default: Redis };
    });
    jest.mock('../../utils/logger');

    // Now require the code under test
    const cacheUtil = require('../../utils/cacheUtil');
    CacheClass = cacheUtil.Cache;

    mockRedisClient = createMockRedisClient();
    // By default, let's define .ping => resolves, for local usage
    mockRedisClient.ping = jest.fn().mockResolvedValue('PONG');

    // Instantiate the Cache
    cache = new CacheClass(mockRedisClient);
  });

  afterEach(async () => {
    if (mockRedisClient?.quit) {
      await mockRedisClient.quit().catch(() => {});
    }
  });

  describe('set()', () => {
    it('should set a key successfully', async () => {
      await expect(cache.set('key', 'value', 123)).resolves.not.toThrow();

      // Confirm the value is actually set in redis-mock
      const stored = await mockRedisClient.get('key');
      expect(stored).toBe('value');
    });

    it('should throw RedisError when set fails', async () => {
      const error = new Error('Set command failed');
      jest.spyOn(mockRedisClient, 'set').mockRejectedValueOnce(error);

      await expect(cache.set('failKey', 'whatever', 99)).rejects.toThrowError(
        'Set command failed',
      );
    });
  });

  describe('get()', () => {
    it('should get an existing key', async () => {
      // Pre-store something
      await mockRedisClient.set('testKey', 'testValue');
      const val = await cache.get('testKey');
      expect(val).toBe('testValue');
    });

    it('should return null for nonexistent key', async () => {
      const val = await cache.get('no-such-key');
      expect(val).toBeNull();
    });

    it('should throw on get failure', async () => {
      jest
        .spyOn(mockRedisClient, 'get')
        .mockRejectedValueOnce(new Error('Get command failed'));

      await expect(cache.get('errKey')).rejects.toThrowError(
        /Get command failed/,
      );
    });
  });

  describe('delete()', () => {
    it('should delete an existing key', async () => {
      await mockRedisClient.set('delKey', 'someVal');
      await expect(cache.delete('delKey')).resolves.not.toThrow();

      const afterDel = await mockRedisClient.get('delKey');
      expect(afterDel).toBeNull();
    });

    it('should throw on delete failure', async () => {
      jest
        .spyOn(mockRedisClient, 'del')
        .mockRejectedValueOnce(new Error('Delete command failed'));

      await expect(cache.delete('badDel')).rejects.toThrowError(
        /Delete command failed/,
      );
    });
  });

  describe('TTL behavior', () => {
    it('should expire a key after set TTL', async () => {
      await cache.set('ttlKey', 'ttlValue', 1);
      let found = await cache.get('ttlKey');
      expect(found).toBe('ttlValue');

      await new Promise((r) => setTimeout(r, 1100));

      found = await cache.get('ttlKey');
      expect(found).toBeNull();
    });
  });
});

///////////////////////////////////////////////////////////////////
// 3) Full coverage for initCache() & getCache() (integration).
///////////////////////////////////////////////////////////////////
describe('initCache() and getCache() - Integration Tests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();

    // Clear environment
    delete process.env.APP_ENV;
    delete process.env.REDIS_URL_TEST;
    delete process.env.SSM_REDIS_ENDPOINT_LOCAL;
    delete process.env.SSM_REDIS_ENDPOINT;
  });

  it('should initialize in test environment successfully', async () => {
    process.env.APP_ENV = 'test';
    process.env.REDIS_URL_TEST = 'redis://fake-host:6379';

    // 1) Mock ioredis with a normal ping => PONG
    jest.mock('ioredis', () => {
      const Redis = jest.fn();
      Redis.mockImplementation(() => ({
        ping: jest.fn().mockResolvedValue('PONG'),
      }));
      return { __esModule: true, default: Redis };
    });

    // 2) Now require the code
    const { initCache, getCache } = require('../../utils/cacheUtil');

    // 3) run test
    await expect(initCache()).resolves.not.toThrow();

    const instance = getCache();
    expect(instance).toBeDefined();
  });

  it('should handle repeated initCache calls (re-initialize check)', async () => {
    process.env.APP_ENV = 'test';
    process.env.REDIS_URL_TEST = 'redis://another-host:6379';

    jest.mock('ioredis', () => {
      const Redis = jest.fn();
      Redis.mockImplementation(() => ({
        ping: jest.fn().mockResolvedValue('PONG'),
      }));
      return { __esModule: true, default: Redis };
    });

    const { initCache } = require('../../utils/cacheUtil');

    const first = await initCache();
    const second = await initCache();

    // The same instance each time
    expect(first).toBe(second);
  });

  it('should throw error if no Redis URL is found (dev)', async () => {
    process.env.APP_ENV = 'dev';
    (getParameterDirect as jest.Mock).mockResolvedValueOnce(undefined);

    jest.mock('ioredis', () => {
      const Redis = jest.fn();
      Redis.mockImplementation(() => ({
        ping: jest.fn().mockResolvedValue('PONG'),
      }));
      return { __esModule: true, default: Redis };
    });

    const { initCache } = require('../../utils/cacheUtil');

    await expect(initCache()).rejects.toThrowError(
      /Redis URL not set in environment variables/,
    );
  });

  it('should throw error if no Redis URL is found (prod)', async () => {
    process.env.APP_ENV = 'prod';
    (getParameterDirect as jest.Mock).mockResolvedValueOnce(undefined);

    jest.mock('ioredis', () => {
      const Redis = jest.fn();
      Redis.mockImplementation(() => ({
        ping: jest.fn().mockResolvedValue('PONG'),
      }));
      return { __esModule: true, default: Redis };
    });

    const { initCache } = require('../../utils/cacheUtil');

    await expect(initCache()).rejects.toThrowError(
      /Redis URL not set in environment variables/,
    );
  });

  it('should normalize URL if missing protocol (test env)', async () => {
    process.env.APP_ENV = 'test';
    process.env.REDIS_URL_TEST = 'hostNoProtocol:7000';

    jest.mock('ioredis', () => {
      const Redis = jest.fn();
      Redis.mockImplementation((url: string) => {
        // We expect it to auto prepend "redis://"
        expect(url).toBe('redis://hostNoProtocol:7000');
        return { ping: jest.fn().mockResolvedValue('PONG') };
      });
      return { __esModule: true, default: Redis };
    });

    const { initCache } = require('../../utils/cacheUtil');

    await expect(initCache()).resolves.not.toThrow();
  });

  it('should throw error if ping fails', async () => {
    process.env.APP_ENV = 'test';
    process.env.REDIS_URL_TEST = 'redis://fails-ping:9999';

    // Reset logger mock
    (logger.error as jest.Mock).mockClear();

    jest.mock('ioredis', () => {
      const Redis = jest.fn();
      Redis.mockImplementation(() => ({
        ping: jest.fn().mockRejectedValue(new Error('Ping failure')),
      }));
      return { __esModule: true, default: Redis };
    });

    const { initCache } = require('../../utils/cacheUtil');

    await expect(initCache()).rejects.toThrowError(/Ping failure/);
  });

  it('should throw if getCache is called before initCache', async () => {
    jest.mock('ioredis', () => {
      const Redis = jest.fn();
      Redis.mockImplementation(() => ({
        ping: jest.fn().mockResolvedValue('PONG'),
      }));
      return { __esModule: true, default: Redis };
    });

    const { getCache } = require('../../utils/cacheUtil');
    expect(() => getCache()).toThrowError(/Cache has not been initialized/);
  });

  //  NEW TEST --------------
  it('should throw error if APP_ENV is not set', async () => {
    // 1) No environment
    delete process.env.APP_ENV;

    // 2) Mock ioredis
    jest.mock('ioredis', () => {
      const Redis = jest.fn();
      Redis.mockImplementation(() => ({
        ping: jest.fn().mockResolvedValue('PONG'),
      }));
      return { __esModule: true, default: Redis };
    });

    // 3) Now require the code
    const { initCache } = require('../../utils/cacheUtil');

    // 4) We expect an error about missing Redis URL
    await expect(initCache()).rejects.toThrowError(
      /Redis URL not set in environment variables/,
    );
  });
});
