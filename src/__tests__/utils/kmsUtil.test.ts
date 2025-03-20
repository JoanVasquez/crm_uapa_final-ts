// kmsUtil.test.ts
import { mockClient } from 'aws-sdk-client-mock';
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { encryptPassword, decryptPassword } from '../../utils/kmsUtil';
import { BaseAppException } from '../../errors/BaseAppException';

jest.mock('../../utils/logger');

const kmsMock = mockClient(KMSClient);

describe('KMS Utilities', () => {
  const testPassword = 'TestPassword123!';
  const testKmsKeyId = 'test-key-id';
  const testEncryptedPassword = 'encrypted-password-base64';
  const sampleBinaryData = Buffer.from('sample-encrypted-data');

  beforeEach(() => {
    jest.clearAllMocks();
    kmsMock.reset();
  });

  describe('encryptPassword', () => {
    it('should successfully encrypt a password', async () => {
      kmsMock.on(EncryptCommand).resolves({
        CiphertextBlob: sampleBinaryData,
      });

      const result = await encryptPassword(testPassword, testKmsKeyId);
      expect(result).toBe(sampleBinaryData.toString('base64'));

      expect(kmsMock.calls()).toHaveLength(1);
      const [call] = kmsMock.calls();
      expect(call.args[0].input).toEqual({
        KeyId: testKmsKeyId,
        Plaintext: Buffer.from(testPassword, 'utf-8'),
      });
    });

    it('should throw BaseAppException when CiphertextBlob is missing', async () => {
      kmsMock.on(EncryptCommand).resolves({
        CiphertextBlob: undefined,
      });

      await expect(encryptPassword(testPassword, testKmsKeyId)).rejects.toThrow(
        BaseAppException,
      );

      await expect(encryptPassword(testPassword, testKmsKeyId)).rejects.toThrow(
        'Encryption failed',
      );
    });

    it('should throw BaseAppException when encryption fails', async () => {
      kmsMock.on(EncryptCommand).rejects(new Error('KMS encryption failed'));

      await expect(encryptPassword(testPassword, testKmsKeyId)).rejects.toThrow(
        BaseAppException,
      );

      await expect(encryptPassword(testPassword, testKmsKeyId)).rejects.toThrow(
        'Encryption failed',
      );
    });
  });

  describe('decryptPassword', () => {
    it('should successfully decrypt a password', async () => {
      kmsMock.on(DecryptCommand).resolves({
        Plaintext: Buffer.from(testPassword, 'utf-8'),
      });

      const result = await decryptPassword(testEncryptedPassword, testKmsKeyId);
      expect(result).toBe(testPassword);

      expect(kmsMock.calls()).toHaveLength(1);
      const [call] = kmsMock.calls();
      expect(call.args[0].input).toEqual({
        KeyId: testKmsKeyId,
        CiphertextBlob: Buffer.from(testEncryptedPassword, 'base64'),
      });
    });

    it('should throw BaseAppException when Plaintext is missing', async () => {
      kmsMock.on(DecryptCommand).resolves({
        Plaintext: undefined,
      });

      await expect(
        decryptPassword(testEncryptedPassword, testKmsKeyId),
      ).rejects.toThrow(BaseAppException);

      await expect(
        decryptPassword(testEncryptedPassword, testKmsKeyId),
      ).rejects.toThrow('Decryption failed');
    });

    it('should throw BaseAppException when decryption fails', async () => {
      kmsMock.on(DecryptCommand).rejects(new Error('KMS decryption failed'));

      await expect(
        decryptPassword(testEncryptedPassword, testKmsKeyId),
      ).rejects.toThrow(BaseAppException);

      await expect(
        decryptPassword(testEncryptedPassword, testKmsKeyId),
      ).rejects.toThrow('Decryption failed');
    });

    it('should handle invalid base64 input', async () => {
      const invalidBase64 = 'not-valid-base64!@#';

      await expect(
        decryptPassword(invalidBase64, testKmsKeyId),
      ).rejects.toThrow(BaseAppException);
    });
  });

  describe('edge cases', () => {
    it('should handle empty password encryption', async () => {
      kmsMock.on(EncryptCommand).resolves({
        CiphertextBlob: Buffer.from(''),
      });

      const result = await encryptPassword('', testKmsKeyId);
      expect(result).toBe('');
    });

    it('should handle empty password decryption', async () => {
      kmsMock.on(DecryptCommand).resolves({
        Plaintext: Buffer.from(''),
      });

      const result = await decryptPassword(
        Buffer.from('').toString('base64'),
        testKmsKeyId,
      );
      expect(result).toBe('');
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      kmsMock.on(EncryptCommand).resolves({
        CiphertextBlob: Buffer.from('encrypted-long-password'),
      });

      await expect(
        encryptPassword(longPassword, testKmsKeyId),
      ).resolves.not.toThrow();
    });
  });
});
