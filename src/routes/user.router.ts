import express, { Router } from 'express';
import UserController from '../controllers/UserController';
import { container } from 'tsyringe';
import {
  loginValidation,
  paginationValidation,
  userValidation,
  userConfirmationValidation,
  userValidations,
} from '../utils/inputValidation';
import { validateRequest } from '../middlewares/error-handler';

import AuthController from '../controllers/AuthController';
import { authorize, verifyToken } from '../middlewares/verifyCognitoToken';

const router: Router = express.Router();

const userController: UserController = container.resolve(UserController);
const authController: AuthController = container.resolve(AuthController);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API endpoints for user management
 */

/**
 * @swagger
 * /api/v1/user/registration:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: "Bearer YOUR_TOKEN"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/user',
  verifyToken,
  authorize('admin'),
  userValidations,
  validateRequest,
  userController.save!,
);

/**
 * @swagger
 * /api/v1/user:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Unauthorized
 */
router.get('/user', verifyToken, authorize('admin'), userController.findAll!);

/**
 * @swagger
 * /api/v1/user/paginated:
 *   get:
 *     summary: Get paginated users
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of users
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/user/paginated',
  verifyToken,
  authorize('admin'),
  paginationValidation,
  validateRequest,
  userController.findAllPaginated!,
);

/**
 * @swagger
 * /api/v1/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get(
  '/user/:id',
  verifyToken,
  authorize('admin'),
  userController.findById!,
);

/**
 * @swagger
 * /api/v1/user/lookup/username:
 *   get:
 *     summary: Get user by username
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */

router.get('/user/lookup/username', verifyToken, userController.findByUsername);

/**
 * @swagger
 * /api/v1/user/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/user/login',
  loginValidation,
  validateRequest,
  authController.login,
);

/**
 * @swagger
 * /api/v1/user/confirm:
 *   post:
 *     summary: Confirm user registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               confirmationcode:
 *                 type: string
 *     responses:
 *       200:
 *         description: User confirmed
 */
router.post(
  '/user/confirm',
  userConfirmationValidation,
  validateRequest,
  authController.confirm,
);

/**
 * @swagger
 * /api/v1/user/resend/code:
 *   post:
 *     summary: Resend confirmation code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Confirmation code resent
 */
router.post(
  '/user/resend/code',
  userValidation,
  validateRequest,
  authController.resendCode,
);

/**
 * @swagger
 * /api/v1/user/password/reset:
 *   post:
 *     summary: Initiate password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset initiated
 */
router.post(
  '/user/password/reset',
  userValidation,
  validateRequest,
  authController.initiatePasswordReset,
);

/**
 * @swagger
 * /api/v1/user/complete/password/reset:
 *   post:
 *     summary: Complete password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               newpassword:
 *                 type: string
 *               confirmationcode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post(
  '/user/complete/password/reset',
  userValidation,
  validateRequest,
  authController.completePasswordReset,
);

/**
 * @swagger
 * /api/v1/user/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/user/logout', authController.logout);

/**
 * @swagger
 * /api/v1/user/refresh:
 *   post:
 *     summary: Refresh user session
 *     tags: [Authentication]
 *     description: Automatically re-authenticate a user using httpOnly cookie if the user is still active.
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/user/refresh', authController.refreshToken);

export default router;
