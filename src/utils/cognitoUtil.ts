import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { AuthError } from '../errors/AuthError';
import { BaseAppException } from '../errors/BaseAppException';
import logger from '../utils/logger';
import { getCachedParameter } from './ssmUtil';
import crypto from 'crypto';

// 🔑 Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
});

/**
 * 🔐 Computes the secret hash required for Cognito authentication.
 * @param username - The username of the user.
 * @param clientId - The Cognito client ID.
 * @param clientSecret - The Cognito client secret.
 * @returns A promise resolving to the computed secret hash.
 */
async function computeSecretHash(
  username: string,
  clientId: string,
  clientSecret: string,
): Promise<string> {
  const message = username + clientId;
  return crypto
    .createHmac('sha256', clientSecret)
    .update(message)
    .digest('base64');
}

/**
 * 🔑 Authenticates a user in Cognito.
 * @param username - The username.
 * @param password - The password.
 * @returns A promise resolving to the authentication token.
 * @throws {AuthError} If authentication fails.
 */
async function authenticate(
  username: string,
  password: string,
): Promise<string> {
  try {
    const clientId = await getCachedParameter(
      process.env.SSM_COGNITO_CLIENT_ID!,
    );
    const clientSecret = await getCachedParameter(
      process.env.SSM_KMS_COGNITO_CLIENT_SECRET!,
    );
    const secretHash = await computeSecretHash(
      username,
      clientId,
      clientSecret,
    );

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    });

    const response = await cognitoClient.send(command);
    if (!response.AuthenticationResult?.IdToken) {
      throw new AuthError('❌ Authentication failed: No token received');
    }

    logger.info(`✅ User authenticated successfully: ${username}`);
    return response.AuthenticationResult.IdToken;
  } catch (error) {
    logger.error(
      `❌ [CognitoService] Authentication failed for user: ${username}`,
      { error },
    );
    throw new AuthError(
      `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * 📝 Registers a new user in Cognito.
 * @param username - The username.
 * @param password - The password.
 * @param email - The user's email.
 * @throws {BaseAppException} If registration fails.
 */
async function registerUser(
  username: string,
  password: string,
  email: string,
): Promise<void> {
  try {
    const clientId = await getCachedParameter(
      process.env.SSM_COGNITO_CLIENT_ID!,
    );
    const clientSecret = await getCachedParameter(
      process.env.SSM_KMS_COGNITO_CLIENT_SECRET!,
    );
    const secretHash = await computeSecretHash(
      username,
      clientId,
      clientSecret,
    );

    const command = new SignUpCommand({
      ClientId: clientId,
      Username: username,
      Password: password,
      SecretHash: secretHash,
      UserAttributes: [{ Name: 'email', Value: email }],
    });

    await cognitoClient.send(command);
    logger.info(`✅ User registered successfully: ${username}`);
  } catch (error) {
    logger.error(
      `❌ [CognitoService] Registration failed for user: ${username}`,
      { error },
    );
    throw new BaseAppException(
      'Registration failed',
      500,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * 📩 Confirms user registration using a verification code.
 * @param username - The username.
 * @param confirmationCode - The confirmation code.
 * @throws {BaseAppException} If confirmation fails.
 */
async function confirmUserRegistration(
  username: string,
  confirmationCode: string,
): Promise<void> {
  try {
    const clientId = await getCachedParameter(
      process.env.SSM_COGNITO_CLIENT_ID!,
    );
    const clientSecret = await getCachedParameter(
      process.env.SSM_KMS_COGNITO_CLIENT_SECRET!,
    );
    const secretHash = await computeSecretHash(
      username,
      clientId,
      clientSecret,
    );

    const command = new ConfirmSignUpCommand({
      ClientId: clientId,
      Username: username,
      SecretHash: secretHash,
      ConfirmationCode: confirmationCode,
    });

    await cognitoClient.send(command);
    logger.info(`✅ User registration confirmed: ${username}`);
  } catch (error) {
    logger.error(
      `❌ [CognitoService] Confirmation failed for user: ${username}`,
      { error },
    );
    throw new BaseAppException(
      'User confirmation failed',
      500,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * 🔄 Initiates a password reset request.
 * @param username - The username.
 * @throws {BaseAppException} If initiation fails.
 */
async function initiatePasswordReset(username: string): Promise<void> {
  try {
    const clientId = await getCachedParameter(
      process.env.SSM_COGNITO_CLIENT_ID!,
    );
    const clientSecret = await getCachedParameter(
      process.env.SSM_KMS_COGNITO_CLIENT_SECRET!,
    );
    const secretHash = await computeSecretHash(
      username,
      clientId,
      clientSecret,
    );

    const command = new ForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
      SecretHash: secretHash,
    });

    await cognitoClient.send(command);
    logger.info(`✅ Password reset initiated for user: ${username}`);
  } catch (error) {
    logger.error(
      `❌ [CognitoService] Password reset initiation failed for user: ${username}`,
      { error },
    );
    throw new BaseAppException(
      'Password reset initiation failed',
      500,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * 🔑 Completes the password reset process.
 * @param username - The username.
 * @param newPassword - The new password.
 * @param confirmationCode - The confirmation code.
 * @throws {BaseAppException} If reset fails.
 */
async function completePasswordReset(
  username: string,
  newPassword: string,
  confirmationCode: string,
): Promise<void> {
  try {
    const clientId = await getCachedParameter(
      process.env.SSM_COGNITO_CLIENT_ID!,
    );
    const clientSecret = await getCachedParameter(
      process.env.SSM_KMS_COGNITO_CLIENT_SECRET!,
    );
    const secretHash = await computeSecretHash(
      username,
      clientId,
      clientSecret,
    );

    const command = new ConfirmForgotPasswordCommand({
      ClientId: clientId,
      Username: username,
      Password: newPassword,
      ConfirmationCode: confirmationCode,
      SecretHash: secretHash,
    });

    await cognitoClient.send(command);
    logger.info(`✅ Password reset completed for user: ${username}`);
  } catch (error) {
    logger.error(
      `❌ [CognitoService] Password reset failed for user: ${username}`,
      { error },
    );
    throw new BaseAppException(
      'Password reset failed',
      500,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * 🔄 Resends the confirmation code to a user.
 * @param username - The username.
 * @throws {BaseAppException} If resend fails.
 */
async function resendConfirmationCode(username: string): Promise<void> {
  try {
    const clientId = await getCachedParameter(
      process.env.SSM_COGNITO_CLIENT_ID!,
    );
    const clientSecret = await getCachedParameter(
      process.env.SSM_KMS_COGNITO_CLIENT_SECRET!,
    );
    const secretHash = await computeSecretHash(
      username,
      clientId,
      clientSecret,
    );

    const command = new ResendConfirmationCodeCommand({
      ClientId: clientId,
      Username: username,
      SecretHash: secretHash,
    });

    await cognitoClient.send(command);
    logger.info(`✅ Confirmation code resent for user: ${username}`);
  } catch (error) {
    logger.error(
      `❌ [CognitoService] Failed to resend confirmation code for user: ${username}`,
      { error },
    );
    throw new BaseAppException(
      'Resending confirmation code failed',
      500,
      error instanceof Error ? error.message : String(error),
    );
  }
}

export {
  authenticate,
  registerUser,
  confirmUserRegistration,
  initiatePasswordReset,
  completePasswordReset,
  resendConfirmationCode,
};
