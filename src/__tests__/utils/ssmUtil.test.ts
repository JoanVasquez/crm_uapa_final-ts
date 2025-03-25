import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { mockClient } from 'aws-sdk-client-mock';
import { getParameterDirect, getCachedParameter } from '../../utils/ssmUtil';
import { getCache } from '../../utils/cacheUtil';
import logger from '../../utils/logger';
import { BaseAppException } from '../../errors/BaseAppException';
import { RedisError } from '../../errors/RedisError';

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('../../utils/cacheUtil');

const ssmMock = mockClient(SSMClient);

describe('🔍 SSM Utility Functions', () => {
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ssmMock.reset();
    (getCache as jest.Mock).mockReturnValue(mockCache);
    mockCache.get.mockReset();
    mockCache.set.mockReset();
  });

  describe('📡 getParameterDirect', () => {
    it('should successfully fetch a parameter from SSM', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: { Value: 'test-value' },
      });

      const result = await getParameterDirect('test-param');

      expect(result).toBe('test-value');
      expect(logger.info).toHaveBeenCalledWith(
        "🔍 [getParameterDirect] Fetching parameter 'test-param' from SSM",
      );
      expect(logger.info).toHaveBeenCalledWith(
        "✅ [getParameterDirect] Successfully retrieved parameter 'test-param'",
      );
      expect(ssmMock.calls()).toHaveLength(1);
    });

    it('should throw BaseAppException when parameter value is missing', async () => {
      ssmMock.on(GetParameterCommand).resolves({ Parameter: {} });

      await expect(getParameterDirect('test-param')).rejects.toThrow(
        BaseAppException,
      );

      expect(logger.error).toHaveBeenCalledWith(
        "❌ [getParameterDirect] Error fetching parameter 'test-param': ❌ Parameter 'test-param' not found in SSM",
        { error: expect.any(BaseAppException) },
      );
    });

    it('should throw BaseAppException on SSM SDK errors', async () => {
      ssmMock.on(GetParameterCommand).rejects(new Error('SSM Error'));

      await expect(getParameterDirect('test-param')).rejects.toThrow(
        BaseAppException,
      );

      expect(logger.error).toHaveBeenCalledWith(
        "❌ [getParameterDirect] Error fetching parameter 'test-param': SSM Error",
        expect.any(Object),
      );
    });

    it('should log "Unknown error" if thrown object is not an Error instance', async () => {
      // Manually mock the send method to throw a plain object
      ssmMock.on(GetParameterCommand).callsFake(() => {
        return Promise.reject({ foo: 'bar' });
      });

      await expect(getParameterDirect('test-param')).rejects.toThrow(
        BaseAppException,
      );

      expect(logger.error).toHaveBeenCalledWith(
        "❌ [getParameterDirect] Error fetching parameter 'test-param': Unknown error",
        { error: { foo: 'bar' } },
      );
    });
    it('should throw BaseAppException when SSM response Parameter is undefined', async () => {
      ssmMock.on(GetParameterCommand).resolves({
        Parameter: undefined, // Explicitly test for Parameter being undefined
      });

      await expect(getParameterDirect('test-param')).rejects.toThrow(
        BaseAppException,
      );

      expect(logger.error).toHaveBeenCalledWith(
        "❌ [getParameterDirect] Error fetching parameter 'test-param': ❌ Parameter 'test-param' not found in SSM",
        { error: expect.any(BaseAppException) },
      );
    });
  });

  describe('🔄 getCachedParameter', () => {
    it('should return cached value if available', async () => {
      mockCache.get.mockResolvedValue('cached-value');

      const result = await getCachedParameter('test-param');

      expect(result).toBe('cached-value');
      expect(mockCache.get).toHaveBeenCalledWith('test-param');
      expect(mockCache.set).not.toHaveBeenCalled();
      expect(ssmMock.calls()).toHaveLength(0);

      expect(logger.info).toHaveBeenCalledWith(
        "✅ [getCachedParameter] Returning cached parameter for 'test-param'",
      );
    });

    it('should fetch parameter from SSM and cache it if not already cached', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(true);

      ssmMock.on(GetParameterCommand).resolves({
        Parameter: { Value: 'ssm-value' },
      });

      const result = await getCachedParameter('test-param', 1800);

      expect(result).toBe('ssm-value');
      expect(mockCache.get).toHaveBeenCalledWith('test-param');
      expect(mockCache.set).toHaveBeenCalledWith(
        'test-param',
        'ssm-value',
        1800,
      );

      expect(logger.info).toHaveBeenCalledWith(
        "✅ [getCachedParameter] Parameter 'test-param' cached for 1800 seconds",
      );
    });

    it('should throw RedisError on cache get failure', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache Error'));

      await expect(getCachedParameter('test-param')).rejects.toThrow(
        RedisError,
      );

      expect(logger.error).toHaveBeenCalledWith(
        "❌ [getCachedParameter] Error fetching parameter 'test-param': Cache Error",
        expect.any(Object),
      );
    });

    it('should throw RedisError on cache set failure', async () => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockRejectedValue(new Error('Cache Set Error'));

      ssmMock.on(GetParameterCommand).resolves({
        Parameter: { Value: 'ssm-value' },
      });

      await expect(getCachedParameter('test-param')).rejects.toThrow(
        RedisError,
      );

      expect(logger.error).toHaveBeenCalledWith(
        "❌ [getCachedParameter] Error fetching parameter 'test-param': Cache Set Error",
        expect.any(Object),
      );
    });

    it('should throw RedisError when fetching from SSM fails', async () => {
      mockCache.get.mockResolvedValue(null);
      ssmMock.on(GetParameterCommand).rejects(new Error('SSM Fetch Error'));

      await expect(getCachedParameter('test-param')).rejects.toThrow(
        RedisError,
      );

      expect(logger.error).toHaveBeenCalledWith(
        "❌ [getCachedParameter] Error fetching parameter 'test-param': Could not fetch parameter: test-param",
        expect.any(Object),
      );
    });

    it('should log "Unknown error" for non-Error instances during cache operations', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockCache.get.mockRejectedValue({ foo: 'bar' } as any);

      await expect(getCachedParameter('test-param')).rejects.toThrow(
        RedisError,
      );

      expect(logger.error).toHaveBeenCalledWith(
        "❌ [getCachedParameter] Error fetching parameter 'test-param': Unknown error",
        expect.any(Object),
      );
    });
  });
});
