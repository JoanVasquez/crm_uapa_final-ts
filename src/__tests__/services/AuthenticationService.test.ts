import { AuthenticationService } from '../../services/AuthenticationService';
import logger from '../../utils/logger';
import {
  confirmUserRegistration as cognitoConfirmUserRegistration,
  authenticate as cognitoAuthenticate,
  registerUser as cognitoRegisterUser,
  resendConfirmationCode as cognitoResendConfirmation,
  refreshToken as cognitoRefreshToken,
} from '../../utils/cognitoUtil';

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('../../utils/cognitoUtil');
jest.mock('tsyringe', () => ({
  injectable: () => jest.fn(),
}));

describe('AuthenticationService', () => {
  let authService: AuthenticationService;

  // Test data
  const testUsername = 'testuser';
  const testPassword = 'TestPassword123!';
  const testEmail = 'test@example.com';
  const testToken = {
    idToken: 'fake-jwt-token',
    refreshToken: 'fake-refresh-token',
  };
  const testConfirmationCode = '123456';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create new instance for each test
    authService = new AuthenticationService();
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      // Arrange
      (cognitoRegisterUser as jest.Mock).mockResolvedValue(undefined);

      // Act
      await authService.registerUser(testUsername, testPassword, testEmail);

      // Assert
      expect(cognitoRegisterUser).toHaveBeenCalledWith(
        testUsername,
        testPassword,
        testEmail,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Registering user in Cognito'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('User successfully registered'),
      );
    });

    it('should throw error when registration fails', async () => {
      // Arrange
      const error = new Error('Registration failed');
      (cognitoRegisterUser as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(
        authService.registerUser(testUsername, testPassword, testEmail),
      ).rejects.toThrow('Registration failed');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user successfully', async () => {
      // Arrange
      (cognitoAuthenticate as jest.Mock).mockResolvedValue(testToken);

      // Act
      const result = await authService.authenticateUser(
        testUsername,
        testPassword,
      );

      // Assert
      expect(result).toStrictEqual(testToken);
      expect(cognitoAuthenticate).toHaveBeenCalledWith(
        testUsername,
        testPassword,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Authenticating user'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('User authenticated successfully'),
      );
    });

    it('should throw error when authentication fails', async () => {
      // Arrange
      const error = new Error('Authentication failed');
      (cognitoAuthenticate as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(
        authService.authenticateUser(testUsername, testPassword),
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('confirmUserRegistration', () => {
    it('should confirm user registration successfully', async () => {
      // Arrange
      (cognitoConfirmUserRegistration as jest.Mock).mockResolvedValue(
        undefined,
      );

      // Act
      await authService.confirmUserRegistration(
        testUsername,
        testConfirmationCode,
      );

      // Assert
      expect(cognitoConfirmUserRegistration).toHaveBeenCalledWith(
        testUsername,
        testConfirmationCode,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Confirming registration'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('User registration confirmed'),
      );
    });

    it('should throw error when confirmation fails', async () => {
      // Arrange
      const error = new Error('Confirmation failed');
      (cognitoConfirmUserRegistration as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(
        authService.confirmUserRegistration(testUsername, testConfirmationCode),
      ).rejects.toThrow('Confirmation failed');
    });
  });

  describe('resendConfirmationCode', () => {
    it('should resend confirmation code successfully', async () => {
      // Arrange
      (cognitoResendConfirmation as jest.Mock).mockResolvedValue(undefined);

      // Act
      await authService.resendConfirmationCode(testUsername);

      // Assert
      expect(cognitoResendConfirmation).toHaveBeenCalledWith(testUsername);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Resending confirmation code'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Confirmation code resent successfully'),
      );
    });

    it('should throw error when resending confirmation code fails', async () => {
      // Arrange
      const error = new Error('Resend failed');
      (cognitoResendConfirmation as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(
        authService.resendConfirmationCode(testUsername),
      ).rejects.toThrow('Resend failed');
    });
  });

  describe('error handling', () => {
    it('should handle non-Error objects in catch blocks', async () => {
      // Arrange
      (cognitoAuthenticate as jest.Mock).mockRejectedValue('Non-error object');

      // Act & Assert
      await expect(
        authService.authenticateUser(testUsername, testPassword),
      ).rejects.toBeTruthy();
    });

    it('should handle undefined error messages', async () => {
      // Arrange
      (cognitoRegisterUser as jest.Mock).mockRejectedValue(new Error());

      // Act & Assert
      await expect(
        authService.registerUser(testUsername, testPassword, testEmail),
      ).rejects.toThrow(Error);
    });
  });

  describe('input validation', () => {
    it('should handle empty username', async () => {
      // Act & Assert
      await expect(
        authService.authenticateUser('', testPassword),
      ).rejects.toBeTruthy();
    });

    it('should handle empty password', async () => {
      // Act & Assert
      await expect(
        authService.authenticateUser(testUsername, ''),
      ).rejects.toBeTruthy();
    });

    it('should handle empty confirmation code', async () => {
      // Act & Assert
      await expect(
        authService.confirmUserRegistration(testUsername, ''),
      ).rejects.toBeTruthy();
    });
  });

  describe('logging behavior', () => {
    it('should log appropriate messages for successful operations', async () => {
      // Arrange
      (cognitoAuthenticate as jest.Mock).mockResolvedValue(testToken);

      // Act
      await authService.authenticateUser(testUsername, testPassword);

      // Assert
      expect(logger.info).toHaveBeenCalledTimes(2); // Start and success messages
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should not log sensitive information', async () => {
      // Arrange
      (cognitoRegisterUser as jest.Mock).mockResolvedValue(undefined);

      // Act
      await authService.registerUser(testUsername, testPassword, testEmail);

      // Assert
      const logCalls = (logger.info as jest.Mock).mock.calls.flat();
      expect(logCalls.join(' ')).not.toContain(testPassword);
    });
  });
  describe('refreshUserToken', () => {
    const validRefreshToken = 'valid-refresh-token';

    it('should refresh the token successfully', async () => {
      (cognitoRefreshToken as jest.Mock).mockResolvedValue('new-id-token');

      const result = await authService.refreshUserToken(validRefreshToken);

      expect(result).toBe('new-id-token');
      expect(cognitoRefreshToken).toHaveBeenCalledWith(validRefreshToken);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Refreshing token for user with refresh token'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Token refreshed successfully'),
      );
    });

    it('should throw error when refresh fails', async () => {
      const error = new Error('Refresh failed');
      (cognitoRefreshToken as jest.Mock).mockRejectedValue(error);

      await expect(
        authService.refreshUserToken(validRefreshToken),
      ).rejects.toThrow('Refresh failed');
    });
  });
});
