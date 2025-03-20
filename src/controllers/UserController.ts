import { autoInjectable, inject } from 'tsyringe';
import BaseController from './BaseController';
import { ICRUD } from '../services/ICRUD';
import { User } from '../models/User';
import logger from '../utils/logger';

/**
 * 👤 UserController - Manages user-related API requests.
 * - Extends `BaseController` for standard CRUD functionality.
 * - Removes `delete` and `update` methods to prevent user deletions and modifications.
 */
@autoInjectable()
export default class UserController extends BaseController {
  constructor(@inject('UserService') protected userService?: ICRUD<User>) {
    super(userService!);
    logger.info('✅ [UserController] Initialized UserController');

    // ❌ Prevent deletion and modification of users
    delete this.delete;
    delete this.update;

    logger.warn(
      '⚠️ [UserController] Delete and Update operations have been disabled for users.',
    );
  }
}
