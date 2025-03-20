import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import { getParameterDirect, getCachedParameter } from '../../utils/ssmUtil';
import { getCache } from '../../utils/cacheUtil';
import logger from '../../utils/logger';
import { BaseAppException } from '../../errors/BaseAppException';
import { RedisError } from '../../errors/RedisError';

// Mock the dependencies
jest.mock('../../utils/logger');
jest.mock('../../utils/cacheUtil');

// Create SSM client mock
const ssmMock = mockClient(SSMClient);

describe('SSM Utility Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    ssmMock.reset();
  });

  describe('getParameterDirect', () => {
    it('should successfully fetch a parameter', async () => {
      // Mock SSM response
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: 'test-value',
        },
      });

      const result = await getParameterDirect('test-param');

      expect(result).toBe('test-value');
      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(ssmMock.calls()).toHaveLength(1);
    });

    it('should throw BaseAppException when parameter value is missing', async () => {
      // Mock SSM response with no value
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {},
      });

      await expect(getParameterDirect('test-param')).rejects.toThrow(
        BaseAppException,
      );
    });

    it('should throw BaseAppException when SSM call fails with an Error instance', async () => {
      // Mock SSM error with an Error instance
      ssmMock.on(GetParameterCommand).rejects(new Error('SSM Error'));

      await expect(getParameterDirect('test-param')).rejects.toThrow(
        BaseAppException,
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it('should log "Unknown error" when error is not an instance of Error in getParameterDirect', async () => {
      // Reject with a plain object (not an instance of Error) by casting it to any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ssmMock.on(GetParameterCommand).rejects({ foo: 'bar' } as any);

      await expect(getParameterDirect('test-param')).rejects.toThrow(
        BaseAppException,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getCachedParameter', () => {
    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
    };

    beforeEach(() => {
      (getCache as jest.Mock).mockReturnValue(mockCache);
      mockCache.get.mockReset();
      mockCache.set.mockReset();
    });

    it('should return cached value when available', async () => {
      mockCache.get.mockResolvedValue('cached-value');

      const result = await getCachedParameter('test-param');

      expect(result).toBe('cached-value');
      expect(mockCache.get).toHaveBeenCalledWith('test-param');
      expect(mockCache.set).not.toHaveBeenCalled();
      expect(ssmMock.calls()).toHaveLength(0);
    });

    it('should fetch and cache value when not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(true);
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: {
          Value: 'new-value',
        },
      });

      const result = await getCachedParameter('test-param', 1800);

      expect(result).toBe('new-value');
      expect(mockCache.get).toHaveBeenCalledWith('test-param');
      expect(mockCache.set).toHaveBeenCalledWith(
        'test-param',
        'new-value',
        1800,
      );
      expect(ssmMock.calls()).toHaveLength(1);
    });

    it('should throw RedisError when cache operations fail with an Error instance', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache Error'));

      await expect(getCachedParameter('test-param')).rejects.toThrow(
        RedisError,
      );
      expect(logger.error).toHaveBeenCalled();
    });

    it('should log "Unknown error" when error is not an instance of Error in getCachedParameter', async () => {
      // Set up cache to throw a plain object by casting it to any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCache.get.mockRejectedValue({ foo: 'bar' } as any);

      await expect(getCachedParameter('test-param')).rejects.toThrow(
        RedisError,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
