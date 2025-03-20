import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { uploadFile } from '../../utils/s3Util';
import { getCachedParameter } from '../../utils/ssmUtil';
import { BaseAppException } from '../../errors/BaseAppException';

// Mock dependencies
jest.mock('../../utils/ssmUtil');
jest.mock('../../utils/logger');

describe('s3Util', () => {
  const s3Mock = mockClient(S3Client);
  const mockGetCachedParameter = getCachedParameter as jest.MockedFunction<
    typeof getCachedParameter
  >;

  const testParams = {
    key: 'test-file.pdf',
    body: Buffer.from('test content'),
    contentType: 'application/pdf',
    bucket: 'XXXXXXXXXXX',
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    s3Mock.reset();

    // Reset environment variables
    process.env.AWS_REGION = 'us-east-1';
    process.env.SSM_KMS_KEY_ID = 'test-ssm-param';

    // Setup default mock responses
    mockGetCachedParameter.mockResolvedValue('mock-kms-key-id');
  });

  describe('uploadFile', () => {
    it('should successfully upload a file to S3', async () => {
      // Setup mock response
      s3Mock.on(PutObjectCommand).resolves({});

      const result = await uploadFile(
        testParams.key,
        testParams.body,
        testParams.contentType,
        testParams.bucket,
      );

      // Verify S3 client was called with correct parameters
      const calls = s3Mock.calls();
      expect(calls.length).toBe(1);

      const [call] = calls;
      expect(call.args[0].input).toMatchObject({
        Bucket: testParams.bucket,
        Key: testParams.key,
        Body: testParams.body,
        ContentType: testParams.contentType,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: 'mock-kms-key-id',
      });

      // Verify returned URL format
      expect(result).toBe(
        `https://${testParams.bucket}.s3.amazonaws.com/${testParams.key}`,
      );
    });

    it('should construct correct URL for non-us-east-1 regions', async () => {
      process.env.AWS_REGION = 'eu-west-1';
      s3Mock.on(PutObjectCommand).resolves({});

      const result = await uploadFile(
        testParams.key,
        testParams.body,
        testParams.contentType,
        testParams.bucket,
      );

      expect(result).toBe(
        `https://${testParams.bucket}.s3-eu-west-1.amazonaws.com/${testParams.key}`,
      );
    });

    it('should throw BaseAppException when upload fails', async () => {
      const errorMessage = 'Upload failed';
      s3Mock.on(PutObjectCommand).rejects(new Error(errorMessage));

      await expect(
        uploadFile(
          testParams.key,
          testParams.body,
          testParams.contentType,
          testParams.bucket,
        ),
      ).rejects.toThrow(BaseAppException);
    });

    it('should use default region when AWS_REGION is not set', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const result = await uploadFile(
        testParams.key,
        testParams.body,
        testParams.contentType,
        testParams.bucket,
      );

      expect(result).toBe(
        `https://${testParams.bucket}.s3.amazonaws.com/${testParams.key}`,
      );
    });
  });

  describe('error handling', () => {
    it('should include error details in BaseAppException', async () => {
      const errorMessage = 'Test error message';
      s3Mock.on(PutObjectCommand).rejects(new Error(errorMessage));

      await expect(
        uploadFile(
          testParams.key,
          testParams.body,
          testParams.contentType,
          testParams.bucket,
        ),
      ).rejects.toMatchObject({
        message: 'Error uploading file',
        statusCode: 500,
        metadata: errorMessage,
      });
    });

    it('should handle non-Error objects in catch block', async () => {
      s3Mock.on(PutObjectCommand).rejects('String error');

      await expect(
        uploadFile(
          testParams.key,
          testParams.body,
          testParams.contentType,
          testParams.bucket,
        ),
      ).rejects.toMatchObject({
        message: 'Error uploading file',
        statusCode: 500,
      });
    });
  });
});
