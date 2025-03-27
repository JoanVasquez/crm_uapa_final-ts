import { autoInjectable, inject } from 'tsyringe';
import BaseController from './BaseController';
import { ICRUD } from '../services/ICRUD';
import { User } from '../models/User';
import logger from '../utils/logger';
import { UserService } from '../services/UserService';
import { NextFunction, Request, Response } from 'express';
import HttpStatus from '../utils/http.status';
import ResponseTemplate from '../utils/response.template';

/**
 * 👤 UserController - Manages user-related API requests.
 * - Extends `BaseController` for standard CRUD functionality.
 * - Removes `delete` and `update` methods to prevent user deletions and modifications.
 */
@autoInjectable()
export default class UserController extends BaseController {
  constructor(
    @inject('UserService') protected userService?: ICRUD<User>,
    @inject('UserServiceImpl')
    private readonly userServiceImpl?: UserService,
  ) {
    super(userService!);
    logger.info('✅ [UserController] Initialized UserController');

    // ❌ Prevent deletion and modification of users
    delete this.delete;
    delete this.update;

    logger.warn(
      '⚠️ [UserController] Delete and Update operations have been disabled for users.',
    );

    this.userServiceImpl = userServiceImpl;
  }

  findByUsername = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const username = req.cookies?.username;

      if (!username) {
        res
          .status(HttpStatus.BAD_REQUEST.code)
          .send(
            new ResponseTemplate(
              HttpStatus.BAD_REQUEST.code,
              HttpStatus.BAD_REQUEST.status,
              'Username not provided',
            ),
          );
        return;
      }

      logger.info(`🔍 [UserController] Finding user by username: ${username}`);

      const user = await this.userServiceImpl?.findByUsername(username);

      if (!user) {
        res
          .status(HttpStatus.NOT_FOUND.code)
          .send(
            new ResponseTemplate(
              HttpStatus.NOT_FOUND.code,
              HttpStatus.NOT_FOUND.status,
              'User not found',
            ),
          );
        return;
      }

      res
        .status(HttpStatus.OK.code)
        .send(
          new ResponseTemplate(
            HttpStatus.OK.code,
            HttpStatus.OK.status,
            'User retrieved successfully',
            user,
          ),
        );

      logger.info(`✅ [UserController] User retrieved: ${username}`);
    } catch (error) {
      logger.error(`❌ [UserController] Error retrieving user by username:`, {
        error,
      });
      next(error);
    }
  };
}
