import { BaseAppException } from '../errors/BaseAppException';
import { NotFoundError } from '../errors/NotFoundError';
import { RequestValidationError } from '../errors/RequestValidationError'; // Updated to accept object or single string
import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { AuthenticationService } from '../services/AuthenticationService';
import { GenericService } from '../services/GenericService';
import { PasswordService } from '../services/PasswordService';
import { Cache } from '../utils/cacheUtil';
import logger from '../utils/logger';
import { inject, injectable } from 'tsyringe';

/**
 * 📦 UserService - Handles all business logic related to user operations.
 * - Extends `GenericService<User>` to inherit common CRUD functionalities.
 * - Manages user authentication, registration, caching, and password resets.
 */
@injectable()
export class UserService extends GenericService<User> {
  constructor(
    @inject('Cache') protected readonly cache: Cache,
    @inject('UserRepository') private readonly userRepository: UserRepository,
    @inject('AuthenticationService')
    // eslint-disable-next-line no-unused-vars
    private readonly authService: AuthenticationService,
    @inject('PasswordService')
    // eslint-disable-next-line no-unused-vars
    private readonly passwordService: PasswordService,
  ) {
    super(cache, userRepository, User);
    logger.info('✅ [UserService] Initialized UserService');
  }

  /**
   * 🆕 Registers a new user.
   * - Encrypts the password.
   * - Registers the user in Cognito.
   * - Saves the user in the database.
   * - Caches the user for quick lookup.
   *
   * @param entity - The user entity to register.
   * @returns The registered user.
   */
  async save(entity: User): Promise<User | null> {
    logger.info(`🔍 [UserService] Registering user: ${entity.username}`);

    if (!/^[\w-]+$/.test(entity.username)) {
      throw new RequestValidationError(
        'Username can only contain letters, numbers, underscores, or dashes.',
      );
    }

    const encryptedPassword = await this.passwordService.getPasswordEncrypted(
      entity.password,
    );
    logger.info('🔐 [UserService] Password encrypted.');

    const user = await this.userRepository.createEntity({
      ...entity,
      password: encryptedPassword,
    });
    if (!user) throw new BaseAppException('User registration failed.');

    const cacheKey = `user:${user.username}`;
    await this.cache.set(cacheKey, JSON.stringify(user), 3600);
    logger.info(`✅ [UserService] User cached successfully: ${cacheKey}`);

    await this.authService.registerUser(
      entity.username,
      entity.password,
      entity.email,
    );

    // 👇 REFRESH CACHE
    await super.refreshAllAndPaginationCache();

    logger.info(
      `✅ [UserService] User registered successfully: ${user.username}`,
    );

    return user;
  }

  /**
   * 📩 Confirms user registration using a verification code.
   * @param username - The username of the user.
   * @param confirmationCode - The confirmation code received via email.
   * @returns A success message.
   */
  async confirmRegistration(
    username: string,
    confirmationCode: string,
  ): Promise<string> {
    await this.authService.confirmUserRegistration(username, confirmationCode);
    logger.info(`✅ [UserService] User registration confirmed: ${username}`);
    return 'User confirmed successfully';
  }

  /**
   * 🔄 Resends the confirmation code to a user.
   * @param username - The username of the user.
   * @returns A success message.
   */
  async resendConfirmationCode(username: string): Promise<string> {
    await this.authService.resendConfirmationCode(username);
    logger.info(
      `✅ [UserService] Confirmation code resent for user: ${username}`,
    );
    return 'Code sent successfully';
  }

  /**
   * 🔐 Authenticates a user.
   * - Attempts to retrieve user from cache before querying the database.
   * - Logs in via Cognito and returns an authentication token.
   *
   * @param username - The username.
   * @param password - The password.
   * @returns An authentication token.
   */
  async authenticate(
    username: string,
    password: string,
  ): Promise<{ token: string; refreshToken: string }> {
    logger.info(`🔍 [UserService] Authenticating user: ${username}`);

    // 📡 Authenticate via Cognito
    const { idToken, refreshToken } = await this.authService.authenticateUser(
      username,
      password,
    );

    // 🔄 Try loading user from cache
    const userData = await this.cache.get(`user:${username}`);
    if (!userData) {
      // 🔍 Load from DB if not in cache
      const user = await this.userRepository.findUserByUsername(username);
      if (!user) {
        logger.warn(`⚠️ [UserService] User not found: ${username}`);
        throw new NotFoundError('User not found');
      }

      await this.cache.set(`user:${username}`, JSON.stringify(user), 3600);
    }

    logger.info(
      `✅ [UserService] User authenticated successfully: ${username}`,
    );
    return { token: idToken, refreshToken };
  }

  /**
   * 🔄 Refreshes a user's authentication token.
   * @param refreshToken - The refresh token.
   * @returns A new authentication token.
   */
  async refreshUserToken(
    username: string,
    refreshToken: string,
  ): Promise<string> {
    logger.info(`🔄 [UserService] Refreshing token for user: ${refreshToken}`);
    const token = await this.authService.refreshUserToken(
      username,
      refreshToken,
    );
    logger.info(`✅ [UserService] Token refreshed successfully: ${token}`);
    return token;
  }

  /**
   * 🔄 Initiates a password reset process for a user.
   * @param username - The user's username.
   * @returns A success message.
   */
  async initiatePasswordReset(username: string): Promise<string> {
    logger.info(
      `🔄 [UserService] Initiating password reset for user: ${username}`,
    );
    await this.passwordService.initiateUserPasswordReset(username);
    return 'Password reset initiated. Check your email for the code.';
  }

  /**
   * 🔓 Completes the password reset process.
   * - Verifies and updates the password in the local database.
   * - Completes the password reset process via Cognito.
   *
   * @param username - The user's username.
   * @param newPassword - The new password.
   * @param confirmationCode - The verification code received via email.
   * @returns A success message.
   */
  async completePasswordReset(
    username: string,
    newPassword: string,
    confirmationCode: string,
  ): Promise<string> {
    logger.info(
      `🔓 [UserService] Completing password reset for user: ${username}`,
    );

    // 🔐 Encrypt and update the local DB password.
    const encryptedPassword =
      await this.passwordService.getPasswordEncrypted(newPassword);
    const user = await this.userRepository.findUserByUsername(username);
    if (!user) {
      throw new NotFoundError('User not found in the repository');
    }

    await this.userRepository.updateEntity(user.id, {
      password: encryptedPassword,
    });

    // 📡 Complete password reset in Cognito.
    await this.passwordService.completeUserPasswordReset(
      username,
      confirmationCode,
      newPassword,
    );

    return 'Password reset successfully completed.';
  }

  /**
   * 🔍 Finds a user by username.
   * - Tries to fetch from cache before querying the database.
   * - If not found in cache, queries the database and stores in cache.
   *
   * @param username - The username.
   * @returns The found user or `null` if not found.
   */
  async findByUsername(username: string): Promise<User | null> {
    logger.info(`🔍 [UserService] Finding user by username: ${username}`);

    // 🔄 Check cache first
    const cacheKey = `user:${username}`;
    const cachedEntity = await this.cache.get(cacheKey);
    if (cachedEntity) {
      logger.info(`✅ [UserService] Retrieved user from cache: ${username}`);
      return JSON.parse(cachedEntity);
    }

    // 🔍 Query database if not found in cache
    const entity = await this.userRepository.findUserByUsername(username);
    if (entity) {
      await this.cache.set(cacheKey, JSON.stringify(entity), 3600);
      logger.info(`✅ [UserService] User found and cached: ${username}`);
    } else {
      logger.warn(`⚠️ [UserService] User not found in database: ${username}`);
    }

    return entity;
  }
}
