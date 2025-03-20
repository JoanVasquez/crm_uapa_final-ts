import { injectable } from 'tsyringe';
import {
  completePasswordReset,
  initiatePasswordReset,
} from '../utils/cognitoUtil';
import { encryptPassword } from '../utils/kmsUtil';
import logger from '../utils/logger';
import { getCachedParameter } from '../utils/ssmUtil';

/**
 * 🔐 PasswordService - Handles password encryption and reset operations.
 * - Uses AWS KMS for password encryption.
 * - Integrates with Cognito for password resets.
 */
@injectable()
export class PasswordService {
  /**
   * 🔒 Encrypts a password using AWS KMS.
   * @param newPassword - The plaintext password.
   * @returns The encrypted password as a string.
   * @throws {BaseAppException} If encryption fails.
   */
  async getPasswordEncrypted(newPassword: string): Promise<string> {
    logger.info('🔑 [PasswordService] Encrypting password...');
    const kmsKeyId = await getCachedParameter(process.env.SSM_KMS_KEY_ID!);
    const encryptedPassword = await encryptPassword(newPassword, kmsKeyId);
    logger.info('✅ [PasswordService] Password encryption successful.');
    return encryptedPassword;
  }

  /**
   * 🔄 Initiates a password reset for a user in Cognito.
   * @param username - The username of the user.
   * @throws {BaseAppException} If the reset process fails.
   */
  async initiateUserPasswordReset(username: string): Promise<void> {
    logger.info(
      `🔄 [PasswordService] Initiating password reset for user: ${username}`,
    );
    await initiatePasswordReset(username);
    logger.info(
      `✅ [PasswordService] Password reset initiated for user: ${username}`,
    );
  }

  /**
   * 🔓 Completes a password reset process in Cognito.
   * @param username - The username of the user.
   * @param confirmationCode - The confirmation code received via email.
   * @param newPassword - The new password to set.
   * @throws {BaseAppException} If the reset completion fails.
   */
  async completeUserPasswordReset(
    username: string,
    confirmationCode: string,
    newPassword: string,
  ): Promise<void> {
    logger.info(
      `🔓 [PasswordService] Completing password reset for user: ${username}`,
    );
    await completePasswordReset(username, newPassword, confirmationCode);
    logger.info(
      `✅ [PasswordService] Password reset completed for user: ${username}`,
    );
  }
}
