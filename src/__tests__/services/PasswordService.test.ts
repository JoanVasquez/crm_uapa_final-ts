import { PasswordService } from '../../services/PasswordService';
import {
  completePasswordReset,
  initiatePasswordReset,
} from '../../utils/cognitoUtil';
import { encryptPassword } from '../../utils/kmsUtil';
import logger from '../../utils/logger';
import { getCachedParameter } from '../../utils/ssmUtil';

// Mock all dependencies
jest.mock('../../utils/cognitoUtil');
jest.mock('../../utils/kmsUtil');
jest.mock('../../utils/logger');
jest.mock('../../utils/ssmUtil');
jest.mock('tsyringe', () => ({
  injectable: () => jest.fn(),
}));

describe('PasswordService', () => {
  let passwordService: PasswordService;

  // Test data
  const testUsername = 'testuser';
  const testPassword = 'TestPassword123!';
  const testConfirmationCode = '123456';
  const testKmsKeyId = 'test-kms-key-id';
  const testEncryptedPassword = 'encrypted-password';

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset environment variables
    process.env.SSM_KMS_KEY_ID = 'test-ssm-parameter';

    // Create new instance for each test
    passwordService = new PasswordService();
  });

  describe('getPasswordEncrypted', () => {
    it('should encrypt password successfully', async () => {
      // Arrange
      (getCachedParameter as jest.Mock).mockResolvedValue(testKmsKeyId);
      (encryptPassword as jest.Mock).mockResolvedValue(testEncryptedPassword);

      // Act
      const result = await passwordService.getPasswordEncrypted(testPassword);

      // Assert
      expect(result).toBe(testEncryptedPassword);
      expect(getCachedParameter).toHaveBeenCalledWith(
        process.env.SSM_KMS_KEY_ID,
      );
      expect(encryptPassword).toHaveBeenCalledWith(testPassword, testKmsKeyId);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Encrypting password'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Password encryption successful'),
      );
    });

    it('should throw error when KMS key retrieval fails', async () => {
      // Arrange
      const error = new Error('Failed to retrieve KMS key');
      (getCachedParameter as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(
        passwordService.getPasswordEncrypted(testPassword),
      ).rejects.toThrow(error);
    });

    it('should throw error when encryption fails', async () => {
      // Arrange
      (getCachedParameter as jest.Mock).mockResolvedValue(testKmsKeyId);
      const error = new Error('Encryption failed');
      (encryptPassword as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(
        passwordService.getPasswordEncrypted(testPassword),
      ).rejects.toThrow(error);
    });
  });

  describe('initiateUserPasswordReset', () => {
    it('should initiate password reset successfully', async () => {
      // Arrange
      (initiatePasswordReset as jest.Mock).mockResolvedValue(undefined);

      // Act
      await passwordService.initiateUserPasswordReset(testUsername);

      // Assert
      expect(initiatePasswordReset).toHaveBeenCalledWith(testUsername);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Initiating password reset'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Password reset initiated'),
      );
    });

    it('should throw error when password reset initiation fails', async () => {
      // Arrange
      const error = new Error('Failed to initiate password reset');
      (initiatePasswordReset as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(
        passwordService.initiateUserPasswordReset(testUsername),
      ).rejects.toThrow(error);
    });
  });

  describe('completeUserPasswordReset', () => {
    it('should complete password reset successfully', async () => {
      // Arrange
      (completePasswordReset as jest.Mock).mockResolvedValue(undefined);

      // Act
      await passwordService.completeUserPasswordReset(
        testUsername,
        testConfirmationCode,
        testPassword,
      );

      // Assert
      expect(completePasswordReset).toHaveBeenCalledWith(
        testUsername,
        testPassword,
        testConfirmationCode,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Completing password reset'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Password reset completed'),
      );
    });

    it('should throw error when password reset completion fails', async () => {
      // Arrange
      const error = new Error('Failed to complete password reset');
      (completePasswordReset as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(
        passwordService.completeUserPasswordReset(
          testUsername,
          testConfirmationCode,
          testPassword,
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('input validation', () => {
    it('should handle empty password', async () => {
      // Act & Assert
      await expect(
        passwordService.getPasswordEncrypted(''),
      ).rejects.toBeTruthy();
    });

    it('should handle empty username', async () => {
      // Act & Assert
      await expect(
        passwordService.initiateUserPasswordReset(''),
      ).rejects.toBeTruthy();
    });

    it('should handle empty confirmation code', async () => {
      // Act & Assert
      await expect(
        passwordService.completeUserPasswordReset(
          testUsername,
          '',
          testPassword,
        ),
      ).rejects.toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle undefined SSM parameter', async () => {
      // Arrange
      process.env.SSM_KMS_KEY_ID = undefined;

      // Act & Assert
      await expect(
        passwordService.getPasswordEncrypted(testPassword),
      ).rejects.toBeTruthy();
    });

    it('should handle non-Error objects in catch blocks', async () => {
      // Arrange
      (getCachedParameter as jest.Mock).mockRejectedValue('Non-error object');

      // Act & Assert
      await expect(
        passwordService.getPasswordEncrypted(testPassword),
      ).rejects.toBeTruthy();
    });
  });

  describe('logging behavior', () => {
    it('should log appropriate messages for successful operations', async () => {
      // Arrange
      (getCachedParameter as jest.Mock).mockResolvedValue(testKmsKeyId);
      (encryptPassword as jest.Mock).mockResolvedValue(testEncryptedPassword);

      // Act
      await passwordService.getPasswordEncrypted(testPassword);

      // Assert
      expect(logger.info).toHaveBeenCalledTimes(2); // Start and success messages
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should not log sensitive information', async () => {
      // Arrange
      (getCachedParameter as jest.Mock).mockResolvedValue(testKmsKeyId);
      (encryptPassword as jest.Mock).mockResolvedValue(testEncryptedPassword);

      // Act
      await passwordService.getPasswordEncrypted(testPassword);

      // Assert
      const logCalls = (logger.info as jest.Mock).mock.calls.flat();
      expect(logCalls.join(' ')).not.toContain(testPassword);
      expect(logCalls.join(' ')).not.toContain(testEncryptedPassword);
    });
  });

  describe('security considerations', () => {
    it('should not expose KMS key ID in logs', async () => {
      // Arrange
      (getCachedParameter as jest.Mock).mockResolvedValue(testKmsKeyId);
      (encryptPassword as jest.Mock).mockResolvedValue(testEncryptedPassword);

      // Act
      await passwordService.getPasswordEncrypted(testPassword);

      // Assert
      const logCalls = (logger.info as jest.Mock).mock.calls.flat();
      expect(logCalls.join(' ')).not.toContain(testKmsKeyId);
    });

    it('should not log sensitive parameters during password reset', async () => {
      // Arrange
      (completePasswordReset as jest.Mock).mockResolvedValue(undefined);

      // Act
      await passwordService.completeUserPasswordReset(
        testUsername,
        testConfirmationCode,
        testPassword,
      );

      // Assert
      const logCalls = (logger.info as jest.Mock).mock.calls.flat();
      expect(logCalls.join(' ')).not.toContain(testPassword);
      expect(logCalls.join(' ')).not.toContain(testConfirmationCode);
    });
  });
});
