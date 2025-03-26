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
  cognitoClient,
} from '../../utils/cognitoUtil';

// We’ll mock this entire file so we can control what getCachedParameter returns:
jest.mock('../../utils/ssmUtil', () => ({
  getCachedParameter: jest.fn(),
}));

import { getCachedParameter } from '../../utils/ssmUtil';

import { AuthError } from '../../errors/AuthError';
import { BaseAppException } from '../../errors/BaseAppException';
import { RequestValidationError } from '../../errors/RequestValidationError';
import { NotFoundError } from '../../errors/NotFoundError';

describe('cognitoUtil tests', () => {
  const cognitoMock = mockClient(CognitoIdentityProviderClient);

  beforeAll(() => {
    // Optionally: any global setup
  });

  beforeEach(() => {
    // Reset the mock state before each test
    cognitoMock.reset();

    // Mock console output if desired (to keep test output clean)
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Provide a default resolved value for getCachedParameter
    // so that any call like getCachedParameter(process.env.SSM_COGNITO_CLIENT_ID!)
    // doesn't fail unless we specifically test a failing scenario.
    (getCachedParameter as jest.Mock).mockResolvedValue('FAKE_PARAM_VALUE');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    // Optionally: any global teardown
  });

  // ----------------------------------------------------------------------------
  // TEST: authenticate
  // ----------------------------------------------------------------------------

  describe('authenticate()', () => {
    it('should throw AuthError if the response has no RefreshToken', async () => {
      cognitoMock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {
          IdToken: 'FAKE_ID_TOKEN',
        },
      });

      await expect(authenticate('testUser', 'testPass')).rejects.toThrow(
        AuthError,
      );
      await expect(authenticate('testUser', 'testPass')).rejects.toThrow(
        '❌ Authentication failed: Token(s) missing',
      );
    });

    it('should throw AuthError if the response has no RefreshToken', async () => {
      cognitoMock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {
          IdToken: 'FAKE_ID_TOKEN',
        },
      });

      await expect(authenticate('testUser', 'testPass')).rejects.toThrow(
        AuthError,
      );
      await expect(authenticate('testUser', 'testPass')).rejects.toThrow(
        '❌ Authentication failed: Token(s) missing',
      );
    });

    it('should throw NotFoundError when Cognito returns UserNotFoundException', async () => {
      // Mock a Cognito exception
      cognitoMock.on(InitiateAuthCommand).rejects({
        name: 'UserNotFoundException',
        message: 'User does not exist',
      });

      await expect(authenticate('badUser', 'testPass')).rejects.toThrow(
        NotFoundError,
      );
      await expect(authenticate('badUser', 'testPass')).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw AuthError when Cognito returns NotAuthorizedException', async () => {
      cognitoMock.on(InitiateAuthCommand).rejects({
        name: 'NotAuthorizedException',
        message: 'Invalid credentials',
      });

      await expect(authenticate('testUser', 'wrongPass')).rejects.toThrow(
        AuthError,
      );
      await expect(authenticate('testUser', 'wrongPass')).rejects.toThrow(
        'Incorrect credentials or unauthorized.',
      );
    });

    it('should throw a generic BaseAppException for unknown errors', async () => {
      cognitoMock.on(InitiateAuthCommand).rejects({
        name: 'SomeUnknownException',
        message: 'Something weird happened',
      });

      await expect(authenticate('testUser', 'testPass')).rejects.toThrow(
        BaseAppException,
      );
      await expect(authenticate('testUser', 'testPass')).rejects.toThrow(
        'Authentication failed',
      );
    });

    //
    // NEW TEST: Non-Error Rejection Coverage
    //
    it('should wrap a non-Error value in BaseAppException', async () => {
      // 1) Mock Cognito to reject with a string (NOT an Error object).
      cognitoMock.on(InitiateAuthCommand).rejects('NON_ERROR_VALUE');

      // 2) We'll do a try/catch so we can inspect the error instance carefully.
      try {
        await authenticate('testUser', 'testPass');
        fail('Expected authenticate to throw, but it did not');
      } catch (error) {
        // 3) Confirm we get a BaseAppException (i.e., that line is hit)
        expect(error).toBeInstanceOf(BaseAppException);

        // The "message" is the default message we passed ("Authentication failed").
        expect((error as BaseAppException).message).toBe(
          'Authentication failed',
        );

        // The "metadata" will contain our original string "NON_ERROR_VALUE".
        expect((error as BaseAppException).metadata).toBe('NON_ERROR_VALUE');
      }
    });

    // ✅ NEW TEST: Already a CustomError scenario
    it('should directly return an existing CustomError without wrapping', async () => {
      const customErr = new AuthError('Already a custom auth error');

      cognitoMock.on(InitiateAuthCommand).rejects(customErr);

      try {
        await authenticate('testUser', 'testPass');
        fail('Expected authenticate to throw, but it did not.');
      } catch (error) {
        expect(error).toBe(customErr); // exactly same error instance
        expect(error).toBeInstanceOf(AuthError);
        expect((error as AuthError).message).toBe(
          'Already a custom auth error',
        );
      }
    });
    it('should handle a non-Error rejection properly by wrapping it in BaseAppException', async () => {
      (
        jest.spyOn(cognitoClient, 'send') as jest.SpyInstance
      ).mockRejectedValueOnce(1234);

      try {
        await authenticate('testUser', 'testPass');
        fail('Expected authenticate to throw, but it did not.');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseAppException);
        expect((error as BaseAppException).message).toBe(
          'Authentication failed',
        );
        expect((error as BaseAppException).metadata).toBe('1234');
      }
    });
    it('should throw AuthError when AuthenticationResult is undefined', async () => {
      cognitoMock.on(InitiateAuthCommand).resolves({});

      await expect(authenticate('testUser', 'testPass')).rejects.toThrow(
        AuthError,
      );
      await expect(authenticate('testUser', 'testPass')).rejects.toThrow(
        '❌ Authentication failed: Token(s) missing',
      );
    });

    it('should throw AuthError when IdToken is null', async () => {
      cognitoMock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {
          IdToken: '',
          RefreshToken: 'some-refresh-token',
        },
      });

      await expect(authenticate('testUser', 'testPass')).rejects.toThrow(
        AuthError,
      );
      await expect(authenticate('testUser', 'testPass')).rejects.toThrow(
        '❌ Authentication failed: Token(s) missing',
      );
    });
    it('should authenticate successfully and log success', async () => {
      cognitoMock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {
          IdToken: 'SUCCESS_ID_TOKEN',
          RefreshToken: 'SUCCESS_REFRESH_TOKEN',
        },
      });

      const { authenticate } = await import('../../utils/cognitoUtil');
      const result = await authenticate('testUser', 'testPass');

      expect(result).toEqual({
        idToken: 'SUCCESS_ID_TOKEN',
        refreshToken: 'SUCCESS_REFRESH_TOKEN',
      });
    });
  });

  // ----------------------------------------------------------------------------
  // TEST: registerUser
  // ----------------------------------------------------------------------------

  describe('registerUser()', () => {
    it('should register a user successfully', async () => {
      cognitoMock.on(SignUpCommand).resolves({}); // SignUpCommand returns no data on success

      await expect(
        registerUser('newUser', 'testPass', 'test@example.com'),
      ).resolves.not.toThrow();
    });

    it('should throw RequestValidationError for invalid password', async () => {
      cognitoMock.on(SignUpCommand).rejects({
        name: 'InvalidPasswordException',
        message: 'Password does not meet criteria',
      });

      await expect(
        registerUser('badPasswordUser', '123', 'test@example.com'),
      ).rejects.toThrow(RequestValidationError);
    });

    it('should throw BaseAppException if user already exists (UsernameExistsException)', async () => {
      cognitoMock.on(SignUpCommand).rejects({
        name: 'UsernameExistsException',
        message: 'User already exists',
      });

      await expect(
        registerUser('existingUser', 'testPass', 'test@example.com'),
      ).rejects.toThrow(BaseAppException);
      await expect(
        registerUser('existingUser', 'testPass', 'test@example.com'),
      ).rejects.toThrow('User already exists.');
    });

    //
    // NEW TEST: InvalidParameterException Coverage
    //
    it('should throw RequestValidationError for InvalidParameterException', async () => {
      cognitoMock.on(SignUpCommand).rejects({
        name: 'InvalidParameterException',
        message: 'Invalid parameters provided',
      });

      try {
        await registerUser('badParamUser', 'testPass', 'test@example.com');
        fail('Expected registerUser to throw, but it did not.');
      } catch (error) {
        expect(error).toBeInstanceOf(RequestValidationError);
        expect((error as RequestValidationError).message).toBe(
          'Validation failed',
        );
        expect((error as RequestValidationError).metadata).toBe(
          'Invalid parameters provided',
        );
      }
    });

    it('should throw RequestValidationError explicitly for InvalidPasswordException', async () => {
      cognitoMock.on(SignUpCommand).rejects({
        name: 'InvalidPasswordException',
        message: 'Validation failed',
      });

      await expect(
        registerUser('user', 'badPass', 'test@example.com'),
      ).rejects.toThrow(RequestValidationError);
      await expect(
        registerUser('user', 'badPass', 'test@example.com'),
      ).rejects.toThrow('Validation failed');
    });
  });

  // ----------------------------------------------------------------------------
  // TEST: confirmUserRegistration
  // ----------------------------------------------------------------------------

  describe('confirmUserRegistration()', () => {
    it('should confirm user registration successfully', async () => {
      cognitoMock.on(ConfirmSignUpCommand).resolves({});

      await expect(
        confirmUserRegistration('testUser', '123456'),
      ).resolves.not.toThrow();
    });

    it('should throw BaseAppException for code mismatch', async () => {
      cognitoMock.on(ConfirmSignUpCommand).rejects({
        name: 'CodeMismatchException',
        message: 'Code mismatch',
      });

      await expect(
        confirmUserRegistration('testUser', '000000'),
      ).rejects.toThrow(BaseAppException);
      await expect(
        confirmUserRegistration('testUser', '000000'),
      ).rejects.toThrow('Invalid code.');
    });

    //
    // NEW TEST: ExpiredCodeException Coverage
    //
    it('should throw BaseAppException for ExpiredCodeException', async () => {
      cognitoMock.on(ConfirmSignUpCommand).rejects({
        name: 'ExpiredCodeException',
        message: 'Code is expired',
      });

      await expect(
        confirmUserRegistration('testUser', '123456'),
      ).rejects.toThrow(BaseAppException);
      await expect(
        confirmUserRegistration('testUser', '123456'),
      ).rejects.toThrow('Expired code.');
    });
  });

  // ----------------------------------------------------------------------------
  // TEST: initiatePasswordReset
  // ----------------------------------------------------------------------------

  describe('initiatePasswordReset()', () => {
    it('should initiate password reset successfully', async () => {
      cognitoMock.on(ForgotPasswordCommand).resolves({});

      await expect(initiatePasswordReset('testUser')).resolves.not.toThrow();
    });

    it('should handle Rate limiting (TooManyRequestsException)', async () => {
      cognitoMock.on(ForgotPasswordCommand).rejects({
        name: 'TooManyRequestsException',
        message: 'Rate limit exceeded',
      });

      await expect(initiatePasswordReset('testUser')).rejects.toThrow(
        BaseAppException,
      );
      await expect(initiatePasswordReset('testUser')).rejects.toThrow(
        'Too many requests, please try again later.',
      );
    });

    //
    // NEW TEST: LimitExceededException Coverage
    //
    it('should handle LimitExceededException with a 429', async () => {
      cognitoMock.on(ForgotPasswordCommand).rejects({
        name: 'LimitExceededException',
        message: 'Password reset limit hit',
      });

      await expect(initiatePasswordReset('testUser')).rejects.toThrow(
        BaseAppException,
      );
      await expect(initiatePasswordReset('testUser')).rejects.toThrow(
        'Too many requests, please try again later.',
      );
    });
    it('should throw RequestValidationError explicitly for InvalidPasswordException', async () => {
      cognitoMock.on(SignUpCommand).rejects({
        name: 'InvalidPasswordException',
        message: 'Invalid password provided',
      });

      try {
        await registerUser('user', 'badPass', 'test@example.com');
        fail('Expected registerUser to throw, but it did not.');
      } catch (error) {
        expect(error).toBeInstanceOf(RequestValidationError);
        expect((error as RequestValidationError).message).toBe(
          'Validation failed',
        ); // ✅ Correct fixed message
        expect((error as RequestValidationError).metadata).toBe(
          'Invalid password provided',
        ); // ✅ Original AWS message
      }
    });
  });

  // ----------------------------------------------------------------------------
  // TEST: completePasswordReset
  // ----------------------------------------------------------------------------

  describe('completePasswordReset()', () => {
    it('should complete password reset successfully', async () => {
      cognitoMock.on(ConfirmForgotPasswordCommand).resolves({});

      await expect(
        completePasswordReset('testUser', 'newPass123!', '123456'),
      ).resolves.not.toThrow();
    });

    it('should handle code mismatch during password reset', async () => {
      cognitoMock.on(ConfirmForgotPasswordCommand).rejects({
        name: 'CodeMismatchException',
        message: 'Code mismatch',
      });

      await expect(
        completePasswordReset('testUser', 'newPass123!', '999999'),
      ).rejects.toThrow('Invalid code.');
    });
  });

  // ----------------------------------------------------------------------------
  // TEST: resendConfirmationCode
  // ----------------------------------------------------------------------------

  describe('resendConfirmationCode()', () => {
    it('should resend the confirmation code successfully', async () => {
      cognitoMock.on(ResendConfirmationCodeCommand).resolves({});

      await expect(resendConfirmationCode('testUser')).resolves.not.toThrow();
    });

    it('should handle NotFoundError when user does not exist', async () => {
      cognitoMock.on(ResendConfirmationCodeCommand).rejects({
        name: 'UserNotFoundException',
        message: 'User not found',
      });

      await expect(resendConfirmationCode('badUser')).rejects.toThrow(
        NotFoundError,
      );
    });
  });
  // ----------------------------------------------------------------------------
  // TEST: refreshToken
  // ----------------------------------------------------------------------------

  describe('refreshToken()', () => {
    const validRefreshToken = 'valid-refresh-token';

    it('should refresh token successfully and return new IdToken', async () => {
      cognitoMock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {
          IdToken: 'NEW_FAKE_ID_TOKEN',
        },
      });

      const { refreshToken } = await import('../../utils/cognitoUtil');
      const token = await refreshToken(validRefreshToken);

      expect(token).toBe('NEW_FAKE_ID_TOKEN');
      expect(getCachedParameter).toHaveBeenCalledWith(
        process.env.SSM_COGNITO_CLIENT_ID!,
      );
    });

    it('should throw AuthError if no IdToken is returned', async () => {
      cognitoMock.on(InitiateAuthCommand).resolves({
        AuthenticationResult: {},
      });

      const { refreshToken } = await import('../../utils/cognitoUtil');

      await expect(refreshToken(validRefreshToken)).rejects.toThrow(AuthError);
      await expect(refreshToken(validRefreshToken)).rejects.toThrow(
        '❌ Refresh failed: No new token received',
      );
    });

    it('should wrap unknown errors in BaseAppException', async () => {
      cognitoMock.on(InitiateAuthCommand).rejects('non-error-value');

      const { refreshToken } = await import('../../utils/cognitoUtil');

      try {
        await refreshToken(validRefreshToken);
      } catch (error) {
        const err = error as BaseAppException;
        expect(err).toBeInstanceOf(BaseAppException);
        expect(err.message).toBe('Refresh token failed');
        expect(err.metadata).toBe('non-error-value');
      }
    });

    it('should pass through custom AuthError', async () => {
      const authErr = new AuthError('Refresh failed hard');
      cognitoMock.on(InitiateAuthCommand).rejects(authErr);

      const { refreshToken } = await import('../../utils/cognitoUtil');

      await expect(refreshToken(validRefreshToken)).rejects.toBe(authErr);
    });
  });
});
