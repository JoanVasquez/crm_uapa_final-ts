import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getCachedParameter } from './ssmUtil';
import { BaseAppException } from '../errors/BaseAppException';
import logger from './logger';

/**
 * 📦 AWS S3 Client Configuration
 * Initializes the S3 client using the specified AWS region.
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
});

/**
 * ☁️ Uploads a file to an S3 bucket with KMS encryption.
 *
 * @param key - The S3 object key (file name).
 * @param body - The file content as a Buffer.
 * @param contentType - The MIME type of the file.
 * @param bucket - The target S3 bucket name.
 * @returns A promise resolving to the URL of the uploaded file.
 * @throws {BaseAppException} If the upload fails.
 */
async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
  bucket: string,
): Promise<string> {
  try {
    // 🔑 Retrieve KMS Key ID for server-side encryption
    const kmsKeyId = await getCachedParameter(process.env.SSM_KMS_KEY_ID!);

    // 🚀 Create an S3 upload command with encryption
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: kmsKeyId,
    });

    // 📤 Execute the upload
    await s3Client.send(command);

    // 🌎 Construct the public URL of the uploaded file
    const region = process.env.AWS_REGION ?? 'us-east-1';
    const location =
      region === 'us-east-1'
        ? `https://${bucket}.s3.amazonaws.com/${key}`
        : `https://${bucket}.s3-${region}.amazonaws.com/${key}`;

    logger.info(`✅ File uploaded successfully: ${location}`);
    return location;
  } catch (error) {
    const err = error as Error;
    logger.error(`❌ [S3Util] Error uploading file: ${err.message}`, {
      error,
    });
    throw new BaseAppException(`Error uploading file`, 500, err.message);
  }
}

export { uploadFile };
