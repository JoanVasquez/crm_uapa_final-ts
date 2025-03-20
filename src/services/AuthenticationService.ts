import logger from '../utils/logger';
import {
  confirmUserRegistration as cognitoConfirmUserRegistration,
  authenticate as cognitoAuthenticate,
  registerUser as cognitoRegisterUser,
  resendConfirmationCode as cognitoResendConfirmation,
} from '../utils/cognitoUtil';
import { injectable } from 'tsyringe';

/**
 * 🔐 AuthenticationService - Handles user authentication and registration with AWS Cognito.
 * - Registers users.
 * - Authenticates users and returns an ID token.
 * - Confirms user registration.
 * - Resends confirmation codes.
 */
@injectable()
export class AuthenticationService {
  /**
   * 🆕 Registers a new user using Cognito.
   * @param username - The username for registration.
   * @param password - The password for registration.
   * @param email - The email address of the user.
   * @throws {Error} If registration fails.
   */
  async registerUser(
    username: string,
    password: string,
    email: string,
  ): Promise<void> {
    logger.info(
      `📝 [AuthenticationService] Registering user in Cognito: ${username}`,
    );
    await cognitoRegisterUser(username, password, email);
    logger.info(
      `✅ [AuthenticationService] User successfully registered in Cognito: ${username}`,
    );
  }

  /**
   * 🔑 Authenticates a user using Cognito.
   * @param username - The username.
   * @param password - The user's password.
   * @returns The authentication token (IdToken).
   * @throws {Error} If authentication fails.
   */
  async authenticateUser(username: string, password: string): Promise<string> {
    logger.info(`🔐 [AuthenticationService] Authenticating user: ${username}`);
    const token = await cognitoAuthenticate(username, password);
    logger.info(
      `✅ [AuthenticationService] User authenticated successfully: ${username}`,
    );
    return token;
  }

  /**
   * 📩 Confirms a user's registration in Cognito.
   * @param username - The username to confirm.
   * @param confirmationCode - The confirmation code provided to the user.
   * @throws {Error} If confirmation fails.
   */
  async confirmUserRegistration(
    username: string,
    confirmationCode: string,
  ): Promise<void> {
    logger.info(
      `📩 [AuthenticationService] Confirming registration for user: ${username}`,
    );
    await cognitoConfirmUserRegistration(username, confirmationCode);
    logger.info(
      `✅ [AuthenticationService] User registration confirmed: ${username}`,
    );
  }

  /**
   * 🔄 Resends a confirmation code to a user.
   * @param username - The username to resend the confirmation code to.
   * @throws {Error} If resending fails.
   */
  async resendConfirmationCode(username: string): Promise<void> {
    logger.info(
      `🔄 [AuthenticationService] Resending confirmation code for user: ${username}`,
    );
    await cognitoResendConfirmation(username);
    logger.info(
      `✅ [AuthenticationService] Confirmation code resent successfully: ${username}`,
    );
  }
}
