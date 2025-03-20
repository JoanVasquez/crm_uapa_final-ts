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
