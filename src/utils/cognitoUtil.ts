import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';

import logger from '../utils/logger';
import { getCachedParameter } from './ssmUtil';

// Errors
import { AuthError } from '../errors/AuthError';
import { BaseAppException } from '../errors/BaseAppException';
import { RequestValidationError } from '../errors/RequestValidationError';
import { NotFoundError } from '../errors/NotFoundError';
import { CustomError } from '../errors/CustomError';

/**
 * Below are some of the common Cognito exception names you might catch:
 *
 * - "UserNotFoundException"
 * - "NotAuthorizedException"
 * - "UsernameExistsException"
 * - "CodeMismatchException"
 * - "ExpiredCodeException"
 * - "InvalidParameterException"
 * - "ResourceNotFoundException"
 * - "LimitExceededException"
 * - "TooManyFailedAttemptsException"
 * - "TooManyRequestsException"
 * - "InvalidPasswordException"
 */

// 🔑 Initialize Cognito client
export const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

/**
 * 🔐 Computes the secret hash required for Cognito authentication.
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
 * Converts AWS Cognito errors into your custom errors.
 */
function mapCognitoErrorToCustomError(
  error: unknown,
  defaultMessage: string,
  defaultStatus: number,
): Error {
  // 1) If it's *already* one of your CustomErrors, just return it as-is
  if (error instanceof CustomError) {
    return error;
  }

  // 2) If it's not even an Error, wrap it in BaseAppException
  if (!(error instanceof Error)) {
    return new BaseAppException(defaultMessage, defaultStatus, String(error));
  }

  switch (error.name) {
    case 'NotAuthorizedException':
      return new AuthError('Incorrect credentials or unauthorized.');
    case 'UserNotFoundException':
      return new NotFoundError('User');
    case 'UsernameExistsException':
      return new BaseAppException('User already exists.', 409, error.message);
    case 'InvalidParameterException':
    case 'InvalidPasswordException':
      return new RequestValidationError(error.message);
    case 'CodeMismatchException':
      return new BaseAppException('Invalid code.', 400, error.message);
    case 'ExpiredCodeException':
      return new BaseAppException('Expired code.', 400, error.message);
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return new BaseAppException(
        'Too many requests, please try again later.',
        429,
        error.message,
      );
    default:
      // If we got here, throw a more generic error
      return new BaseAppException(defaultMessage, defaultStatus, error.message);
  }
}

/**
 * 🔑 Authenticates a user in Cognito.
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

    // Convert AWS error to our AuthError or fallback
    throw mapCognitoErrorToCustomError(error, 'Authentication failed', 401);
  }
}

/**
 * 📝 Registers a new user in Cognito.
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

    // Convert AWS error to our custom error or fallback
    throw mapCognitoErrorToCustomError(error, 'Registration failed', 500);
  }
}

/**
 * 📩 Confirms user registration using a verification code.
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

    throw mapCognitoErrorToCustomError(error, 'User confirmation failed', 500);
  }
}

/**
 * 🔄 Initiates a password reset request.
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
      {
        error,
      },
    );

    throw mapCognitoErrorToCustomError(
      error,
      'Password reset initiation failed',
      500,
    );
  }
}

/**
 * 🔑 Completes the password reset process.
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

    throw mapCognitoErrorToCustomError(error, 'Password reset failed', 500);
  }
}

/**
 * 🔄 Resends the confirmation code to a user.
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
      {
        error,
      },
    );

    throw mapCognitoErrorToCustomError(
      error,
      'Resending confirmation code failed',
      500,
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
