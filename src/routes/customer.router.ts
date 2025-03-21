import express, { Router } from 'express';
import CustomerController from '../controllers/CustomerController';
import { container } from 'tsyringe';
import { paginationValidation } from '../utils/inputValidation';
import { validateRequest } from '../middlewares/error-handler';
import { authorize, verifyToken } from '../middlewares/verifyCognitoToken';

const router: Router = express.Router();
const customerController: CustomerController =
  container.resolve(CustomerController);

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: API endpoints for customer management
 */

/**
 * @swagger
 * /api/v1/customer:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all customers
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/customer',
  verifyToken,
  authorize('admin'),
  customerController.findAll!,
);

/**
 * @swagger
 * /api/v1/customer/paginated:
 *   get:
 *     summary: Get paginated customers
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of customers
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/customer/paginated',
  verifyToken,
  authorize('admin'),
  paginationValidation,
  validateRequest,
  customerController.findAllPaginated!,
);

/**
 * @swagger
 * /api/v1/customer/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
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
 *         description: Customer data
 *       404:
 *         description: Customer not found
 */
router.get(
  '/customer/:id',
  verifyToken,
  authorize('admin'),
  customerController.findById!,
);

/**
 * @swagger
 * /api/v1/customer/email:
 *   get:
 *     summary: Find customer by email
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *       404:
 *         description: Customer not found
 */
router.get(
  '/customer/email',
  verifyToken,
  authorize('admin'),
  customerController.findByEmail,
);

export default router;
