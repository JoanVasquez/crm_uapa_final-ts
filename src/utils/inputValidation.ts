import { body, query } from 'express-validator';
import { UserRole } from '../models/User'; // Ensure UserRole is properly imported

/**
 * 🚨 Validation Messages
 * Standardized error messages for validation responses.
 */
export const validationMessage = {
  // ✅ General Messages
  REQUIRED: '⚠️ Required Field',
  INVALID_EMAIL: '✉️ Invalid email address',
  PASSWORD_LENGTH: '🔑 Password must be at least 6 characters long',
  BOOLEAN: '🔘 Value must be a boolean',
  INVALID_ROLE: '⚠️ Invalid role. Must be either admin or user',

  // 📄 Pagination Messages
  PAGE_VALIDATION:
    "📌 Query parameter 'page' cannot be empty and must be a number",
  PER_PAGE_VALIDATION:
    "📌 Query parameter 'per_page' cannot be empty and must be a number",
  INVALID_NUMBER: '🔢 Value must be a valid number',
  POSITIVE_NUMBER: '📈 Value must be a positive number',
  STRING_LENGTH: (min: number, max: number) =>
    `📏 Must be between ${min} and ${max} characters`,
};

/**
 * 👤 User Validations
 * Ensures valid input fields for user creation and updates.
 */
export const userValidations = [
  body('email')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isEmail()
    .withMessage(validationMessage.INVALID_EMAIL),
  body('username').notEmpty().withMessage(validationMessage.REQUIRED),
  body('password')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isLength({ min: 6 })
    .withMessage(validationMessage.PASSWORD_LENGTH),
  body('role')
    .optional()
    .isIn([UserRole.ADMIN, UserRole.SELLER])
    .withMessage(validationMessage.INVALID_ROLE),
];

/**
 * 📄 Pagination Validations
 * Ensures valid pagination query parameters.
 */
export const paginationValidation = [
  query('page').isNumeric().withMessage(validationMessage.PAGE_VALIDATION),
  query('per_page')
    .isNumeric()
    .withMessage(validationMessage.PER_PAGE_VALIDATION),
];

/**
 * 🔑 Login Validations
 * Ensures valid input fields for user authentication.
 */
export const loginValidation = [
  body('username').notEmpty().withMessage(validationMessage.REQUIRED),
  body('password')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isLength({ min: 6 })
    .withMessage(validationMessage.PASSWORD_LENGTH),
];

/**
 * ✅ User Confirmation Validations
 * Ensures valid input fields for account confirmation.
 */
export const userConfirmationValidation = [
  body('username').notEmpty().withMessage(validationMessage.REQUIRED),
  body('confirmationcode').notEmpty().withMessage(validationMessage.REQUIRED),
];

/**
 * 👤 User Validation (Basic)
 * Ensures 'username' field is not empty.
 */
export const userValidation = [
  body('username').notEmpty().withMessage(validationMessage.REQUIRED),
];

/**
 * 🔄 Complete Password Reset Validation
 * Ensures valid fields for password reset completion.
 */
export const completePasswordResetValidation = [
  body('username').notEmpty().withMessage(validationMessage.REQUIRED),
  body('password')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isLength({ min: 6 })
    .withMessage(validationMessage.PASSWORD_LENGTH),
  body('confirmationcode').notEmpty().withMessage(validationMessage.REQUIRED),
];

/**
 * 📦 Product Validations
 * Ensures valid input fields for product creation and updates.
 */
export const productValidation = [
  // Name is required and must be between 3 and 255 characters
  body('name')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isString()
    .isLength({ min: 3, max: 255 })
    .withMessage(validationMessage.STRING_LENGTH(3, 255)),

  // Description is optional but must be a string if provided
  body('description')
    .optional()
    .isString()
    .isLength({ min: 5 })
    .withMessage(validationMessage.STRING_LENGTH(5, 500)),

  // Price is required and must be a positive number
  body('price')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isNumeric()
    .withMessage(validationMessage.INVALID_NUMBER)
    .custom((value) => value > 0)
    .withMessage(validationMessage.POSITIVE_NUMBER),

  // Available quantity is required and must be a positive integer
  body('available_quantity')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isInt({ min: 0 })
    .withMessage(validationMessage.POSITIVE_NUMBER),
];

/**
 * 🛒 Sell Validations
 * Ensures valid input fields for processing a sale.
 */
export const sellValidation = [
  body('customer.email')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isEmail()
    .withMessage(validationMessage.INVALID_EMAIL),

  body('customer.first_name')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isString()
    .withMessage('📝 First name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage(validationMessage.STRING_LENGTH(2, 50)),

  body('customer.last_name')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isString()
    .withMessage('📝 Last name must be a string')
    .isLength({ min: 2, max: 50 })
    .withMessage(validationMessage.STRING_LENGTH(2, 50)),

  body('customer.address')
    .optional()
    .isString()
    .withMessage('📍 Address must be a string')
    .isLength({ min: 5, max: 255 })
    .withMessage(validationMessage.STRING_LENGTH(5, 255)),

  body('customer.phonenumber')
    .optional()
    .isString()
    .withMessage('📞 Phone number must be a string')
    .isLength({ min: 8, max: 20 })
    .withMessage(validationMessage.STRING_LENGTH(8, 20)),

  body('sales')
    .isArray({ min: 1 })
    .withMessage('🛍️ Sales must be an array with at least one item'),

  body('sales.*.productId')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isNumeric()
    .withMessage(validationMessage.INVALID_NUMBER),

  body('sales.*.quantity')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isInt({ min: 1 })
    .withMessage(validationMessage.POSITIVE_NUMBER),

  body('sales.*.salePrice')
    .notEmpty()
    .withMessage(validationMessage.REQUIRED)
    .isFloat({ min: 0.01 })
    .withMessage(validationMessage.POSITIVE_NUMBER),
];
