import { autoInjectable, inject } from 'tsyringe';
import { NextFunction, Request, Response } from 'express';
import ResponseTemplate from '../utils/response.template';
import { UserService } from '../services/UserService';
import httpStatus from '../utils/http.status';
import logger from '../utils/logger';

/**
 * 🔐 AuthController - Handles user authentication and account actions.
 * - Provides endpoints for login, confirmation, and password resets.
 */

@autoInjectable()
export default class AuthController {
  constructor(
    @inject('UserService') private readonly userService?: UserService,
  ) {
    this.userService = userService;
  }

  /**
   * 🔑 Handles user login.
   * - Authenticates the user and sets a secure cookie with the token.
   */
  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, password } = req.body;
      logger.info(`🔑 [AuthController] Login attempt for user: ${username}`);

      const result = await this.userService?.authenticate(username, password);
      res.cookie('token', result?.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 3600000,
      });

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(
            httpStatus.OK.code,
            'OK',
            'Authentication successful',
            result,
          ),
        );
      logger.info(`✅ [AuthController] User authenticated: ${username}`);
    } catch (error) {
      logger.error(
        `❌ [AuthController] Login failed for user: ${req.body.username}`,
        { error },
      );
      next(error);
    }
  };

  /**
   * 📩 Confirms user registration.
   * - Validates the provided confirmation code.
   */
  confirm = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, confirmationcode } = req.body;
      logger.info(
        `📩 [AuthController] Confirming registration for: ${username}`,
      );

      const result = await this.userService?.confirmRegistration(
        username,
        confirmationcode,
      );

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(
            httpStatus.OK.code,
            httpStatus.OK.status,
            result,
          ),
        );
      logger.info(
        `✅ [AuthController] User registration confirmed: ${username}`,
      );
    } catch (error) {
      logger.error(
        `❌ [AuthController] Confirmation failed for user: ${req.body.username}`,
        { error },
      );
      next(error);
    }
  };

  /**
   * 🔄 Resends confirmation code to the user.
   */
  resendCode = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { username } = req.body;
      logger.info(
        `🔄 [AuthController] Resending confirmation code for: ${username}`,
      );

      const result = await this.userService?.resendConfirmationCode(username);

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(
            httpStatus.OK.code,
            httpStatus.OK.status,
            result,
          ),
        );
      logger.info(
        `✅ [AuthController] Confirmation code resent to: ${username}`,
      );
    } catch (error) {
      logger.error(
        `❌ [AuthController] Failed to resend code for user: ${req.body.username}`,
        { error },
      );
      next(error);
    }
  };

  /**
   * 🔑 Initiates a password reset request.
   */
  initiatePasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { username } = req.body;
      logger.info(
        `🔑 [AuthController] Initiating password reset for: ${username}`,
      );

      const result = await this.userService?.initiatePasswordReset(username);

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(
            httpStatus.OK.code,
            httpStatus.OK.status,
            result,
          ),
        );
      logger.info(
        `✅ [AuthController] Password reset initiated for: ${username}`,
      );
    } catch (error) {
      logger.error(
        `❌ [AuthController] Password reset initiation failed for user: ${req.body.username}`,
        { error },
      );
      next(error);
    }
  };

  /**
   * 🔓 Completes a password reset process.
   */
  completePasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { username, newpassword, confirmationcode } = req.body;
      logger.info(
        `🔓 [AuthController] Completing password reset for: ${username}`,
      );

      const result = await this.userService?.completePasswordReset(
        username,
        newpassword,
        confirmationcode,
      );

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(
            httpStatus.OK.code,
            httpStatus.OK.status,
            result,
          ),
        );
      logger.info(
        `✅ [AuthController] Password reset completed for: ${username}`,
      );
    } catch (error) {
      logger.error(
        `❌ [AuthController] Password reset failed for user: ${req.body.username}`,
        { error },
      );
      next(error);
    }
  };

  /**
   * 🚪 Logs out the user by clearing the JWT token cookie.
   */
  logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      });

      res
        .status(httpStatus.OK.code)
        .send(
          new ResponseTemplate(httpStatus.OK.code, 'OK', 'Logout successful'),
        );
      logger.info('🚪 [AuthController] User logged out successfully');
    } catch (error) {
      logger.error('❌ [AuthController] Logout failed', { error });
      next(error);
    }
  };
}
