import express, { Router } from 'express';
import ProductController from '../controllers/ProductController';
import { container } from 'tsyringe';
import {
  paginationValidation,
  productValidation,
} from '../utils/inputValidation';
import { validateRequest } from '../middlewares/error-handler';
import { authorize, verifyToken } from '../middlewares/verifyCognitoToken';

const router: Router = express.Router();
const productController: ProductController =
  container.resolve(ProductController);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API endpoints for product management
 */

/**
 * @swagger
 * /api/v1/product:
 *   post:
 *     summary: Add a new product
 *     tags: [Products]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               available_quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Product added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/product',
  verifyToken,
  authorize('admin'),
  productValidation,
  validateRequest,
  productController.save!,
);

/**
 * @swagger
 * /api/v1/product:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all products
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/product',
  verifyToken,
  authorize('admin'),
  productController.findAll!,
);

/**
 * @swagger
 * /api/v1/product/paginated:
 *   get:
 *     summary: Get paginated products
 *     tags: [Products]
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
 *         description: Paginated list of products
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/product/paginated',
  verifyToken,
  authorize('admin'),
  paginationValidation,
  validateRequest,
  productController.findAllPaginated!,
);

/**
 * @swagger
 * /api/v1/product/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
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
 *         description: Product data
 *       404:
 *         description: Product not found
 */
router.get(
  '/product/:id',
  verifyToken,
  authorize('admin'),
  productController.findById!,
);

/**
 * @swagger
 * /api/v1/product/{id}:
 *   put:
 *     summary: Update product details
 *     tags: [Products]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               available_quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/product/:id',
  verifyToken,
  authorize('admin'),
  productValidation,
  validateRequest,
  productController.update!,
);

/**
 * @swagger
 * /api/v1/product/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/product/:id',
  verifyToken,
  authorize('admin'),
  productController.delete!,
);

export default router;
