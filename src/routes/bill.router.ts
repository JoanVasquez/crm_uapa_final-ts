import express, { Router } from 'express';
import BillController from '../controllers/BillController';
import { container } from 'tsyringe';
import { paginationValidation } from '../utils/inputValidation';
import { validateRequest } from '../middlewares/error-handler';
import { verifyToken } from '../middlewares/verifyCognitoToken';

const router: Router = express.Router();
const billController: BillController = container.resolve(BillController);

/**
 * @swagger
 * tags:
 *   name: Bills
 *   description: API endpoints for bill management
 */

/**
 * @swagger
 * /api/v1/bill:
 *   get:
 *     summary: Get all bills
 *     tags: [Bills]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bills
 *       401:
 *         description: Unauthorized
 */
router.get('/bill', verifyToken, billController.findAll!);

/**
 * @swagger
 * /api/v1/bill/paginated:
 *   get:
 *     summary: Get paginated bills
 *     tags: [Bills]
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
 *         description: Paginated list of bills
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/bill/paginated',
  verifyToken,
  paginationValidation,
  validateRequest,
  billController.findAllPaginated!,
);

/**
 * @swagger
 * /api/v1/bill/{id}:
 *   get:
 *     summary: Get bill by ID
 *     tags: [Bills]
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
 *         description: Bill data
 *       404:
 *         description: Bill not found
 *       401:
 *         description: Unauthorized
 */
router.get('/bill/:id', verifyToken, billController.findById!);

export default router;
