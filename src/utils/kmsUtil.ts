import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { BaseAppException } from '../errors/BaseAppException';
import logger from './logger';

/**
 * 🔑 AWS KMS Client Configuration
 * Initializes the AWS Key Management Service (KMS) client with the specified region.
 */
const region = process.env.AWS_REGION ?? 'us-east-1';
const kmsClient = new KMSClient({ region });

/**
 * 🔒 Encrypts a password using AWS KMS.
 *
 * @param password - The plaintext password to encrypt.
 * @param kmsKeyId - The AWS KMS Key ID used for encryption.
 * @returns A promise resolving to the encrypted password as a base64-encoded string.
 * @throws {BaseAppException} If encryption fails.
 */
async function encryptPassword(
  password: string,
  kmsKeyId: string,
): Promise<string> {
  try {
    const command = new EncryptCommand({
      KeyId: kmsKeyId,
      Plaintext: Buffer.from(password, 'utf-8'),
    });

    const response = await kmsClient.send(command);

    if (!response.CiphertextBlob) {
      logger.error('❌ Failed to encrypt password: No CiphertextBlob returned');
      throw new BaseAppException(
        'Encryption failed: No encrypted data received',
      );
    }

    const encryptedPassword = Buffer.from(response.CiphertextBlob).toString(
      'base64',
    );
    logger.info('✅ Password successfully encrypted');
    return encryptedPassword;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Error encrypting password: ${errorMessage}`);
    throw new BaseAppException('Encryption failed', 500, errorMessage);
  }
}

/**
 * 🔓 Decrypts an encrypted password using AWS KMS.
 *
 * @param encryptedPassword - The base64-encoded encrypted password.
 * @param kmsKeyId - The AWS KMS Key ID used for decryption.
 * @returns A promise resolving to the decrypted plaintext password.
 * @throws {BaseAppException} If decryption fails.
 */
async function decryptPassword(
  encryptedPassword: string,
  kmsKeyId: string,
): Promise<string> {
  try {
    const ciphertextBlob = Buffer.from(encryptedPassword, 'base64');

    const command = new DecryptCommand({
      KeyId: kmsKeyId,
      CiphertextBlob: ciphertextBlob,
    });

    const response = await kmsClient.send(command);

    if (!response.Plaintext) {
      logger.error('❌ Failed to decrypt password: No Plaintext returned');
      throw new BaseAppException(
        'Decryption failed: No decrypted data received',
      );
    }

    const decryptedPassword = Buffer.from(response.Plaintext).toString('utf-8');
    logger.info('✅ Password successfully decrypted');
    return decryptedPassword;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`❌ Error decrypting password: ${errorMessage}`);
    throw new BaseAppException('Decryption failed', 500, errorMessage);
  }
}

export { encryptPassword, decryptPassword };
