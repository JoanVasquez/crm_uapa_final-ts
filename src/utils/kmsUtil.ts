import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { BaseAppException } from '../errors/BaseAppException';
import { CustomError } from '../errors/CustomError';
import logger from './logger';

const region = process.env.AWS_REGION;
const kmsClient = new KMSClient({ region });

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
    if (error instanceof CustomError) {
      logger.error(`❌ Custom error during encryption: ${error.message}`);
      throw error; // Rethrow CustomErrors as-is
    }

    let errorMessage: string = '';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    logger.error(`❌ Unknown error during encryption: ${errorMessage}`);
    throw new BaseAppException('Encryption failed', 500, errorMessage);
  }
}

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
    if (error instanceof CustomError) {
      logger.error(`❌ Custom error during decryption: ${error.message}`);
      throw error; // Rethrow CustomErrors as-is
    }

    let errorMessage: string = '';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    logger.error(`❌ Unknown error during decryption: ${errorMessage}`);
    throw new BaseAppException('Decryption failed', 500, errorMessage);
  }
}

export { encryptPassword, decryptPassword };
