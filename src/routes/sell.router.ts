import express, { Router } from 'express';
import SellController from '../controllers/SellController';
import { container } from 'tsyringe';
import { paginationValidation, sellValidation } from '../utils/inputValidation';
import { validateRequest } from '../middlewares/error-handler';
import { authorize, verifyToken } from '../middlewares/verifyCognitoToken';

const router: Router = express.Router();
const sellController: SellController = container.resolve(SellController);

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: API endpoints for sales management
 */

/**
 * @swagger
 * /api/v1/sell:
 *   post:
 *     summary: Process a sale transaction
 *     tags: [Sales]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer:
 *                 type: object
 *                 required:
 *                   - email
 *                   - first_name
 *                   - last_name
 *                 properties:
 *                   email:
 *                     type: string
 *                     example: test@example.com
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   address:
 *                     type: string
 *                   phonenumber:
 *                     type: string
 *               sales:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                     - salePrice
 *                   properties:
 *                     productId:
 *                       type: number
 *                     quantity:
 *                       type: number
 *                     salePrice:
 *                       type: number
 *     responses:
 *       201:
 *         description: Sale processed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  '/sell',
  verifyToken,
  authorize('seller'),
  sellValidation,
  validateRequest,
  sellController.processSales,
);

/**
 * @swagger
 * /api/v1/sell:
 *   get:
 *     summary: Get all sales
 *     tags: [Sales]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all sales
 *       401:
 *         description: Unauthorized
 */
router.get('/sell', verifyToken, authorize('seller'), sellController.findAll!);

/**
 * @swagger
 * /api/v1/sell/paginated:
 *   get:
 *     summary: Get paginated sales
 *     tags: [Sales]
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
 *         description: Paginated list of sales
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/sell/paginated',
  verifyToken,
  authorize('seller'),
  paginationValidation,
  validateRequest,
  sellController.findAllPaginated!,
);

/**
 * @swagger
 * /api/v1/sell/{id}:
 *   get:
 *     summary: Get sale by ID
 *     tags: [Sales]
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
 *         description: Sale data
 *       404:
 *         description: Sale not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/sell/:id',
  verifyToken,
  authorize('seller'),
  sellController.findById!,
);

export default router;
