import { mockClient } from 'aws-sdk-client-mock';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  authenticate,
  registerUser,
  confirmUserRegistration,
  initiatePasswordReset,
  completePasswordReset,
  resendConfirmationCode,
} from '../../utils/cognitoUtil';
import { getCachedParameter } from '../../utils/ssmUtil';
import { AuthError } from '../../errors/AuthError';
import { BaseAppException } from '../../errors/BaseAppException';

// Mock external dependencies
jest.mock('../../utils/ssmUtil');
jest.mock('../../utils/logger');

// Setup mocks
const cognitoMock = mockClient(CognitoIdentityProviderClient);
const mockGetCachedParameter = getCachedParameter as jest.MockedFunction<
  typeof getCachedParameter
>;

describe('Cognito Utilities', () => {
  const testUsername = 'testUser';
  const testPassword = 'TestPass123!';
  const testEmail = 'test@example.com';
  const testClientId = 'test-client-id';
  const testClientSecret = 'test-client-secret';
  const testIdToken = 'test-id-token';
  const testConfirmationCode = '123456';

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    cognitoMock.reset();

    // Setup common mock responses
    mockGetCachedParameter.mockImplementation(async (param) => {
      if (param === process.env.SSM_COGNITO_CLIENT_ID) return testClientId;
      if (param === process.env.SSM_KMS_COGNITO_CLIENT_SECRET)
        return testClientSecret;
      return '';
    });
  });

  describe('authenticate', () => {
    it('should successfully authenticate a user', async () => {
      // Setup mock response
      cognitoMock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {
          IdToken: testIdToken,
        },
      });

      const token = await authenticate(testUsername, testPassword);

      expect(token).toBe(testIdToken);
      expect(cognitoMock.calls()).toHaveLength(1);
      const [call] = cognitoMock.calls();
      expect(call.args[0].input).toEqual({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: testClientId,
        AuthParameters: {
          USERNAME: testUsername,
          PASSWORD: testPassword,
          SECRET_HASH: expect.any(String),
        },
      });
    });

    it('should throw AuthError when authentication fails', async () => {
      cognitoMock
        .on(InitiateAuthCommand)
        .rejects(new Error('Invalid credentials'));

      await expect(authenticate(testUsername, testPassword)).rejects.toThrow(
        AuthError,
      );
    });

    it('should throw AuthError when no token is received', async () => {
      cognitoMock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: { IdToken: undefined },
      });

      await expect(authenticate(testUsername, testPassword)).rejects.toThrow(
        'Authentication failed: No token received',
      );
    });
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      cognitoMock.on(SignUpCommand).resolves({});

      await expect(
        registerUser(testUsername, testPassword, testEmail),
      ).resolves.not.toThrow();

      expect(cognitoMock.calls()).toHaveLength(1);
      const [call] = cognitoMock.calls();
      expect(call.args[0].input).toEqual({
        ClientId: testClientId,
        Username: testUsername,
        Password: testPassword,
        SecretHash: expect.any(String),
        UserAttributes: [{ Name: 'email', Value: testEmail }],
      });
    });

    it('should throw BaseAppException when registration fails', async () => {
      cognitoMock.on(SignUpCommand).rejects(new Error('Registration failed'));

      await expect(
        registerUser(testUsername, testPassword, testEmail),
      ).rejects.toThrow(BaseAppException);
    });
  });

  describe('confirmUserRegistration', () => {
    it('should successfully confirm user registration', async () => {
      cognitoMock.on(ConfirmSignUpCommand).resolves({});

      await expect(
        confirmUserRegistration(testUsername, testConfirmationCode),
      ).resolves.not.toThrow();

      expect(cognitoMock.calls()).toHaveLength(1);
      const [call] = cognitoMock.calls();
      expect(call.args[0].input).toEqual({
        ClientId: testClientId,
        Username: testUsername,
        SecretHash: expect.any(String),
        ConfirmationCode: testConfirmationCode,
      });
    });

    it('should throw BaseAppException when confirmation fails', async () => {
      cognitoMock
        .on(ConfirmSignUpCommand)
        .rejects(new Error('Confirmation failed'));

      await expect(
        confirmUserRegistration(testUsername, testConfirmationCode),
      ).rejects.toThrow(BaseAppException);
    });
  });

  describe('password reset flow', () => {
    it('should successfully initiate password reset', async () => {
      cognitoMock.on(ForgotPasswordCommand).resolves({});

      await expect(initiatePasswordReset(testUsername)).resolves.not.toThrow();
    });

    it('should successfully complete password reset', async () => {
      cognitoMock.on(ConfirmForgotPasswordCommand).resolves({});

      await expect(
        completePasswordReset(testUsername, testPassword, testConfirmationCode),
      ).resolves.not.toThrow();
    });
  });

  describe('resendConfirmationCode', () => {
    it('should successfully resend confirmation code', async () => {
      cognitoMock.on(ResendConfirmationCodeCommand).resolves({});

      await expect(resendConfirmationCode(testUsername)).resolves.not.toThrow();
    });

    it('should throw BaseAppException when resend fails', async () => {
      cognitoMock
        .on(ResendConfirmationCodeCommand)
        .rejects(new Error('Resend failed'));

      await expect(resendConfirmationCode(testUsername)).rejects.toThrow(
        BaseAppException,
      );
    });
  });
});
