import express, { Router } from 'express';
import CustomerController from '../controllers/CustomerController';
import { container } from 'tsyringe';
import {
  customerValidation,
  paginationValidation,
} from '../utils/inputValidation';
import { validateRequest } from '../middlewares/error-handler';
import { verifyToken } from '../middlewares/verifyCognitoToken';

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
router.get('/customer', verifyToken, customerController.findAll!);

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
router.get('/customer/:id', verifyToken, customerController.findById!);

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
router.get('/customer/email', verifyToken, customerController.findByEmail);

/**
 * @swagger
 * /api/v1/customer/{id}:
 *   put:
 *     summary: Update customer by ID
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/Customer'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
router.put(
  '/customer/:id',
  customerValidation,
  verifyToken,
  customerController.update!,
);

/**
 * @swagger
 * /api/v1/customer:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/Customer'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/customer',
  customerValidation,
  verifyToken,
  customerController.save!,
);

export default router;
