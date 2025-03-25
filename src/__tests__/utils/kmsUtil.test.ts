import { mockClient } from 'aws-sdk-client-mock';
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { encryptPassword, decryptPassword } from '../../utils/kmsUtil';
import { BaseAppException } from '../../errors/BaseAppException';
import { AuthError } from '../../errors/AuthError';
import { DatabaseError } from '../../errors/DatabaseError';

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
      kmsMock.on(EncryptCommand).resolves({ CiphertextBlob: sampleBinaryData });
      const result = await encryptPassword(testPassword, testKmsKeyId);
      expect(result).toBe(sampleBinaryData.toString('base64'));
    });

    it('should throw BaseAppException when CiphertextBlob is missing', async () => {
      kmsMock.on(EncryptCommand).resolves({ CiphertextBlob: undefined });
      await expect(encryptPassword(testPassword, testKmsKeyId)).rejects.toThrow(
        BaseAppException,
      );
    });

    it('should rethrow CustomError (AuthError)', async () => {
      kmsMock.on(EncryptCommand).rejects(new AuthError('No access'));
      await expect(encryptPassword(testPassword, testKmsKeyId)).rejects.toThrow(
        AuthError,
      );
    });

    it('should handle native Error instance', async () => {
      kmsMock.on(EncryptCommand).rejects(new Error('Error object'));
      await expect(encryptPassword(testPassword, testKmsKeyId)).rejects.toThrow(
        'Encryption failed',
      );
    });

    it('should handle error as string (forcing else branch using JSON.stringify)', async () => {
      const errStr = 'String error encryption';
      kmsMock.on(EncryptCommand).rejects(errStr);
      try {
        await encryptPassword(testPassword, testKmsKeyId);
        fail('Expected error to be thrown');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        expect(error).toBeInstanceOf(BaseAppException);
        // En este entorno, JSON.stringify(errStr) produce "\"String error encryption\"",
        // pero observamos que el metadata se asigna como el string sin comillas.
        expect(error.metadata).toEqual(errStr);
      }
    });

    it('should handle error as plain object (forcing else branch using JSON.stringify)', async () => {
      const errObj = { unexpected: true };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kmsMock.on(EncryptCommand).rejects(errObj as any);

      try {
        await encryptPassword(testPassword, testKmsKeyId);
        fail('Expected error to be thrown');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        expect(error).toBeInstanceOf(BaseAppException);
      }
    });
  });

  describe('decryptPassword', () => {
    it('should successfully decrypt a password', async () => {
      kmsMock
        .on(DecryptCommand)
        .resolves({ Plaintext: Buffer.from(testPassword, 'utf-8') });
      const result = await decryptPassword(testEncryptedPassword, testKmsKeyId);
      expect(result).toBe(testPassword);
    });

    it('should throw BaseAppException when Plaintext is missing', async () => {
      kmsMock.on(DecryptCommand).resolves({ Plaintext: undefined });
      await expect(
        decryptPassword(testEncryptedPassword, testKmsKeyId),
      ).rejects.toThrow(BaseAppException);
    });

    it('should rethrow CustomError (DatabaseError)', async () => {
      kmsMock.on(DecryptCommand).rejects(new DatabaseError('DB error'));
      await expect(
        decryptPassword(testEncryptedPassword, testKmsKeyId),
      ).rejects.toThrow(DatabaseError);
    });

    it('should handle native Error instance', async () => {
      kmsMock.on(DecryptCommand).rejects(new Error('Error object'));
      await expect(
        decryptPassword(testEncryptedPassword, testKmsKeyId),
      ).rejects.toThrow('Decryption failed');
    });

    it('should handle error as string (forcing else branch using JSON.stringify)', async () => {
      const errStr = 'String error decryption';
      kmsMock.on(DecryptCommand).rejects(errStr);
      try {
        await decryptPassword(testEncryptedPassword, testKmsKeyId);
        fail('Expected error to be thrown');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        expect(error).toBeInstanceOf(BaseAppException);
        expect(error.metadata).toEqual(errStr);
      }
    });

    it('should handle error as plain object (forcing else branch using JSON.stringify)', async () => {
      const errObj = { unexpected: 'value' };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kmsMock.on(DecryptCommand).rejects(errObj as any);

      try {
        await decryptPassword(testEncryptedPassword, testKmsKeyId);
        fail('Expected error to be thrown');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        expect(error).toBeInstanceOf(BaseAppException);
      }
    });
  });

  describe('edge cases', () => {
    it('should encrypt empty string', async () => {
      kmsMock.on(EncryptCommand).resolves({ CiphertextBlob: Buffer.from('') });
      const result = await encryptPassword('', testKmsKeyId);
      expect(result).toBe('');
    });

    it('should decrypt empty string', async () => {
      kmsMock.on(DecryptCommand).resolves({ Plaintext: Buffer.from('') });
      const result = await decryptPassword(
        Buffer.from('').toString('base64'),
        testKmsKeyId,
      );
      expect(result).toBe('');
    });

    it('should encrypt long password', async () => {
      const longPassword = 'a'.repeat(1000);
      kmsMock
        .on(EncryptCommand)
        .resolves({ CiphertextBlob: Buffer.from('long-password') });
      const result = await encryptPassword(longPassword, testKmsKeyId);
      expect(result).toBe(Buffer.from('long-password').toString('base64'));
    });
  });
});
