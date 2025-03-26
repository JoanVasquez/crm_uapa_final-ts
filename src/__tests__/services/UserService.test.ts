// src/__tests__/services/UserService.test.ts

import { UserService } from '../../services/UserService';
import { User, UserRole } from '../../models/User';
import { UserRepository } from '../../repositories/UserRepository';
import { AuthenticationService } from '../../services/AuthenticationService';
import { PasswordService } from '../../services/PasswordService';
import { Cache } from '../../utils/cacheUtil';
import logger from '../../utils/logger';
import { BaseAppException } from '../../errors/BaseAppException';
import { RequestValidationError } from '../../errors/RequestValidationError';
import { NotFoundError } from '../../errors/NotFoundError';

// Mock dependencies
jest.mock('../../utils/logger');
jest.mock('tsyringe', () => ({
  injectable: () => jest.fn(),
  inject: () => jest.fn(),
  container: {
    resolve: jest.fn(),
    register: jest.fn(),
  },
}));
jest.mock('../../repositories/UserRepository');
jest.mock('../../services/AuthenticationService');
jest.mock('../../services/PasswordService');

describe('UserService', () => {
  let userService: UserService;
  let mockCache: jest.Mocked<Cache>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockAuthService: jest.Mocked<AuthenticationService>;
  let mockPasswordService: jest.Mocked<PasswordService>;

  const testUser: User = {
    id: 1,
    username: 'testuser',
    password: 'encrypted-password',
    email: 'test@example.com',
    is_active: true,
    role: UserRole.ADMIN,
  };

  const encryptedPassword = 'encrypted-password';
  const confirmationCode = '123456';

  beforeEach(() => {
    // Create mock Cache
    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      client: {},
    } as unknown as jest.Mocked<Cache>;

    // Mocked UserRepository
    mockUserRepository = {
      createEntity: jest.fn(),
      findEntityById: jest.fn(),
      findUserByUsername: jest.fn(),
      updateEntity: jest.fn(),
      deleteEntity: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    // Mocked AuthService
    mockAuthService = {
      registerUser: jest.fn(),
      confirmUserRegistration: jest.fn(),
      resendConfirmationCode: jest.fn(),
      authenticateUser: jest.fn(),
      refreshUserToken: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationService>;

    // Mocked PasswordService
    mockPasswordService = {
      getPasswordEncrypted: jest.fn(),
      initiateUserPasswordReset: jest.fn(),
      completeUserPasswordReset: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>;

    // Create service
    userService = new UserService(
      mockCache,
      mockUserRepository,
      mockAuthService,
      mockPasswordService,
    );

    jest.clearAllMocks();
  });

  // ------------------------------------
  // Existing blocks for "save", "confirmRegistration", etc.
  // ------------------------------------

  describe('save', () => {
    it('should successfully register a new user', async () => {
      mockPasswordService.getPasswordEncrypted.mockResolvedValue(
        encryptedPassword,
      );
      mockAuthService.registerUser.mockResolvedValue();
      mockUserRepository.createEntity.mockResolvedValue(testUser);
      mockCache.set.mockResolvedValue(undefined);

      const result = await userService.save(testUser);

      expect(result).toEqual(testUser);
      expect(mockPasswordService.getPasswordEncrypted).toHaveBeenCalledWith(
        testUser.password,
      );
      expect(mockAuthService.registerUser).toHaveBeenCalledWith(
        testUser.username,
        encryptedPassword,
        testUser.email,
      );
      expect(mockUserRepository.createEntity).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should throw RequestValidationError for invalid username format', async () => {
      const invalidUser = { ...testUser, username: 'invalid@username' };

      await expect(userService.save(invalidUser)).rejects.toThrow(
        RequestValidationError,
      );
    });

    it('should throw BaseAppException when user creation fails', async () => {
      mockPasswordService.getPasswordEncrypted.mockResolvedValue(
        encryptedPassword,
      );
      mockAuthService.registerUser.mockResolvedValue();
      mockUserRepository.createEntity.mockResolvedValue(null);

      await expect(userService.save(testUser)).rejects.toThrow(
        BaseAppException,
      );
    });
  });

  describe('confirmRegistration', () => {
    it('should confirm user registration successfully', async () => {
      mockAuthService.confirmUserRegistration.mockResolvedValue();

      const result = await userService.confirmRegistration(
        testUser.username,
        confirmationCode,
      );

      expect(result).toBe('User confirmed successfully');
      expect(mockAuthService.confirmUserRegistration).toHaveBeenCalledWith(
        testUser.username,
        confirmationCode,
      );
    });

    it('should propagate errors from auth service', async () => {
      const error = new Error('Confirmation failed');
      mockAuthService.confirmUserRegistration.mockRejectedValue(error);

      await expect(
        userService.confirmRegistration(testUser.username, confirmationCode),
      ).rejects.toThrow(error);
    });
  });

  describe('resendConfirmationCode', () => {
    it('should resend confirmation code successfully', async () => {
      mockAuthService.resendConfirmationCode.mockResolvedValue();

      const result = await userService.resendConfirmationCode(
        testUser.username,
      );

      expect(result).toBe('Code sent successfully');
      expect(mockAuthService.resendConfirmationCode).toHaveBeenCalledWith(
        testUser.username,
      );
    });

    it('should propagate errors when resending fails', async () => {
      const error = new Error('Resend failed');
      mockAuthService.resendConfirmationCode.mockRejectedValue(error);

      await expect(
        userService.resendConfirmationCode(testUser.username),
      ).rejects.toThrow(error);
    });
  });

  describe('error handling', () => {
    it('should handle password encryption failures', async () => {
      const error = new Error('Encryption failed');
      mockPasswordService.getPasswordEncrypted.mockRejectedValue(error);

      await expect(userService.save(testUser)).rejects.toThrow(error);
    });

    it('should handle Cognito registration failures', async () => {
      mockPasswordService.getPasswordEncrypted.mockResolvedValue(
        encryptedPassword,
      );
      const error = new Error('Cognito registration failed');
      mockAuthService.registerUser.mockRejectedValue(error);

      await expect(userService.save(testUser)).rejects.toThrow(error);
    });

    it('should handle cache failures gracefully', async () => {
      mockPasswordService.getPasswordEncrypted.mockResolvedValue(
        encryptedPassword,
      );
      mockAuthService.registerUser.mockResolvedValue();
      mockUserRepository.createEntity.mockResolvedValue(testUser);
      mockCache.set.mockRejectedValue(new Error('Cache error'));

      await expect(userService.save(testUser)).rejects.toThrow();
    });
  });

  describe('logging behavior', () => {
    it('should log appropriate messages during user registration', async () => {
      mockPasswordService.getPasswordEncrypted.mockResolvedValue(
        encryptedPassword,
      );
      mockAuthService.registerUser.mockResolvedValue();
      mockUserRepository.createEntity.mockResolvedValue(testUser);
      mockCache.set.mockResolvedValue(undefined);

      await userService.save(testUser);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Registering user'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Password encrypted'),
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('User cached successfully'),
      );
    });

    it('should not log sensitive information', async () => {
      mockPasswordService.getPasswordEncrypted.mockResolvedValue(
        encryptedPassword,
      );
      mockAuthService.registerUser.mockResolvedValue();
      mockUserRepository.createEntity.mockResolvedValue(testUser);
      mockCache.set.mockResolvedValue(undefined);

      await userService.save(testUser);

      const logCalls = (logger.info as jest.Mock).mock.calls.flat();
      expect(logCalls.join(' ')).not.toContain(testUser.password);
      expect(logCalls.join(' ')).not.toContain(encryptedPassword);
    });
  });

  // ------------------------------------
  // NEW TESTS FOR MISSING METHODS
  // ------------------------------------

  describe('authenticate', () => {
    it('should authenticate a user successfully (cache miss, DB hit)', async () => {
      // Arrange
      mockAuthService.authenticateUser.mockResolvedValue({
        idToken: 'fake-jwt-token',
        refreshToken: 'fake-refresh-token',
      });

      // user not in cache
      mockCache.get.mockResolvedValue(null);
      // user found in DB
      mockUserRepository.findUserByUsername.mockResolvedValue(testUser);

      // Act
      const result = await userService.authenticate(
        testUser.username,
        'some-password',
      );

      // Assert
      expect(result).toEqual({
        token: 'fake-jwt-token',
        refreshToken: 'fake-refresh-token',
      });

      expect(mockAuthService.authenticateUser).toHaveBeenCalledWith(
        testUser.username,
        'some-password',
      );
      expect(mockCache.get).toHaveBeenCalledWith(`user:${testUser.username}`);
      expect(mockUserRepository.findUserByUsername).toHaveBeenCalledWith(
        testUser.username,
      );
      expect(mockCache.set).toHaveBeenCalledWith(
        `user:${testUser.username}`,
        JSON.stringify(testUser),
        3600,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('User authenticated successfully'),
      );
    });

    it('should authenticate a user successfully (cache hit)', async () => {
      mockAuthService.authenticateUser.mockResolvedValue({
        idToken: 'fake-jwt-token',
        refreshToken: 'fake-refresh-token',
      });

      // user found in cache
      mockCache.get.mockResolvedValue(JSON.stringify(testUser));

      const result = await userService.authenticate(
        testUser.username,
        'some-password',
      );

      expect(result).toEqual({
        token: 'fake-jwt-token',
        refreshToken: 'fake-refresh-token',
      });

      expect(mockAuthService.authenticateUser).toHaveBeenCalledWith(
        testUser.username,
        'some-password',
      );
      // no DB call
      expect(mockUserRepository.findUserByUsername).not.toHaveBeenCalled();
      // no cache.set for user
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if user not found in DB', async () => {
      mockAuthService.authenticateUser.mockResolvedValue({
        idToken: 'fake-jwt-token',
        refreshToken: 'fake-refresh-token',
      });

      mockCache.get.mockResolvedValue(null);
      mockUserRepository.findUserByUsername.mockResolvedValue(null);

      await expect(
        userService.authenticate(testUser.username, 'some-password'),
      ).rejects.toThrow(NotFoundError);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('User not found'),
      );
    });

    it('should propagate authService errors', async () => {
      const authError = new Error('Auth failed');
      mockAuthService.authenticateUser.mockRejectedValue(authError);

      await expect(
        userService.authenticate(testUser.username, 'wrong-pass'),
      ).rejects.toThrow(authError);
    });
  });

  describe('initiatePasswordReset', () => {
    it('should initiate a password reset successfully', async () => {
      mockPasswordService.initiateUserPasswordReset.mockResolvedValue();
      const result = await userService.initiatePasswordReset(testUser.username);

      expect(result).toBe(
        'Password reset initiated. Check your email for the code.',
      );
      expect(
        mockPasswordService.initiateUserPasswordReset,
      ).toHaveBeenCalledWith(testUser.username);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Initiating password reset'),
      );
    });

    it('should propagate errors from passwordService', async () => {
      const resetError = new Error('Reset error');
      mockPasswordService.initiateUserPasswordReset.mockRejectedValue(
        resetError,
      );

      await expect(
        userService.initiatePasswordReset(testUser.username),
      ).rejects.toThrow(resetError);
    });
  });

  describe('completePasswordReset', () => {
    it('should complete a password reset successfully', async () => {
      // Arrange
      const newPass = 'new-password';
      mockPasswordService.getPasswordEncrypted.mockResolvedValue(
        'encrypted-new-password',
      );
      mockUserRepository.findUserByUsername.mockResolvedValue(testUser);
      mockUserRepository.updateEntity.mockResolvedValue({
        ...testUser,
        password: 'encrypted-new-password',
      });
      mockPasswordService.completeUserPasswordReset.mockResolvedValue();

      // Act
      const result = await userService.completePasswordReset(
        testUser.username,
        newPass,
        confirmationCode,
      );

      // Assert
      expect(result).toBe('Password reset successfully completed.');
      expect(mockPasswordService.getPasswordEncrypted).toHaveBeenCalledWith(
        newPass,
      );
      expect(mockUserRepository.findUserByUsername).toHaveBeenCalledWith(
        testUser.username,
      );
      expect(mockUserRepository.updateEntity).toHaveBeenCalledWith(
        testUser.id,
        { password: 'encrypted-new-password' },
      );
      expect(
        mockPasswordService.completeUserPasswordReset,
      ).toHaveBeenCalledWith(testUser.username, confirmationCode, newPass);
    });

    it('should throw NotFoundError if user not found in DB', async () => {
      mockPasswordService.getPasswordEncrypted.mockResolvedValue(
        'encrypted-new-password',
      );
      mockUserRepository.findUserByUsername.mockResolvedValue(null);

      await expect(
        userService.completePasswordReset(
          testUser.username,
          'new-pass',
          confirmationCode,
        ),
      ).rejects.toThrow(NotFoundError);
    });

    it('should propagate errors from passwordService or repository', async () => {
      const newPass = 'new-password';
      // Make the passwordService fail
      const error = new Error('Password reset error');
      mockPasswordService.getPasswordEncrypted.mockRejectedValue(error);

      await expect(
        userService.completePasswordReset(
          testUser.username,
          newPass,
          confirmationCode,
        ),
      ).rejects.toThrow(error);
    });
  });

  describe('findByUsername', () => {
    it('should return user from cache if found', async () => {
      const cacheKey = `user:${testUser.username}`;
      mockCache.get.mockResolvedValue(JSON.stringify(testUser));

      const result = await userService.findByUsername(testUser.username);

      expect(result).toEqual(testUser);
      expect(mockCache.get).toHaveBeenCalledWith(cacheKey);
      // no DB call
      expect(mockUserRepository.findUserByUsername).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Retrieved user from cache'),
      );
    });

    it('should fetch user from DB if not in cache', async () => {
      const cacheKey = `user:${testUser.username}`;
      mockCache.get.mockResolvedValue(null);
      mockUserRepository.findUserByUsername.mockResolvedValue(testUser);

      const result = await userService.findByUsername(testUser.username);

      expect(result).toEqual(testUser);
      expect(mockUserRepository.findUserByUsername).toHaveBeenCalledWith(
        testUser.username,
      );
      expect(mockCache.set).toHaveBeenCalledWith(
        cacheKey,
        JSON.stringify(testUser),
        3600,
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('User found and cached'),
      );
    });

    it('should return null if user not found', async () => {
      mockCache.get.mockResolvedValue(null);
      mockUserRepository.findUserByUsername.mockResolvedValue(null);

      const result = await userService.findByUsername('nonexistent');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('User not found in database'),
      );
    });
  });
  describe('refreshUserToken', () => {
    it('should refresh the token successfully', async () => {
      mockAuthService.refreshUserToken.mockResolvedValue('new-id-token');

      const result = await userService.refreshUserToken('valid-refresh-token');

      expect(result).toBe('new-id-token');
      expect(mockAuthService.refreshUserToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Token refreshed successfully'),
      );
    });

    it('should propagate errors from authService', async () => {
      const error = new Error('Refresh failed');
      mockAuthService.refreshUserToken.mockRejectedValue(error);

      await expect(
        userService.refreshUserToken('invalid-token'),
      ).rejects.toThrow(error);
    });
  });
});
