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

export const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

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

function mapCognitoErrorToCustomError(
  error: unknown,
  defaultMessage: string,
  defaultStatus: number,
): Error {
  if (error instanceof CustomError) return error;
  if (!(error instanceof Error))
    return new BaseAppException(defaultMessage, defaultStatus, String(error));

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
      return new BaseAppException(defaultMessage, defaultStatus, error.message);
  }
}

async function authenticate(
  username: string,
  password: string,
): Promise<{ idToken: string; refreshToken: string }> {
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

    const idToken = response.AuthenticationResult?.IdToken;
    const refreshToken = response.AuthenticationResult?.RefreshToken;

    if (!idToken || !refreshToken) {
      throw new AuthError('❌ Authentication failed: Token(s) missing');
    }

    logger.info(`✅ User authenticated successfully: ${username}`);
    return { idToken, refreshToken };
  } catch (error) {
    logger.error(
      `❌ [CognitoService] Authentication failed for user: ${username}`,
      { error },
    );
    throw mapCognitoErrorToCustomError(error, 'Authentication failed', 401);
  }
}

async function refreshToken(refreshToken: string): Promise<string> {
  try {
    const clientId = await getCachedParameter(
      process.env.SSM_COGNITO_CLIENT_ID!,
    );

    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult?.IdToken) {
      throw new AuthError('❌ Refresh failed: No new token received');
    }

    logger.info('🔄 [AuthenticationService] Token refreshed successfully');
    return response.AuthenticationResult.IdToken;
  } catch (error) {
    logger.error('❌ [AuthenticationService] Refresh failed', { error });
    throw mapCognitoErrorToCustomError(error, 'Refresh token failed', 401);
  }
}

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
    throw mapCognitoErrorToCustomError(error, 'Registration failed', 500);
  }
}

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
    throw mapCognitoErrorToCustomError(
      error,
      'Password reset initiation failed',
      500,
    );
  }
}

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
    throw mapCognitoErrorToCustomError(
      error,
      'Resending confirmation code failed',
      500,
    );
  }
}

export {
  authenticate,
  refreshToken,
  registerUser,
  confirmUserRegistration,
  initiatePasswordReset,
  completePasswordReset,
  resendConfirmationCode,
};
