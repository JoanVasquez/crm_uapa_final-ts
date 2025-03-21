import { autoInjectable, inject } from 'tsyringe';
import BaseController from './BaseController';
import { ICRUD } from '../services/ICRUD';
import { Customer } from '../models/Customer';
import logger from '../utils/logger';
import { NextFunction, Request, Response } from 'express';
import HttpStatus from '../utils/http.status';
import ResponseTemplate from '../utils/response.template';
import { CustomerService } from '../services/CustomerService';

/**
 * 👤 CustomerController - Handles API requests related to customers.
 * - Extends `BaseController` for standard CRUD operations.
 * - Supports full CRUD functionality (Create, Read, Update, Delete).
 */
@autoInjectable()
export default class CustomerController extends BaseController {
  constructor(
    @inject('CustomerService') protected customerService?: ICRUD<Customer>,
    @inject('CustomerServiceImpl')
    private readonly customerServiceImpl?: CustomerService,
  ) {
    super(customerService!);
    logger.info('✅ [CustomerController] Initialized CustomerController');
    this.customerServiceImpl = customerServiceImpl;

    delete this.delete;
    delete this.save;
  }

  findByEmail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const email = req.query.email as string;

      logger.info(`🔍 [CustomerController] Searching for customer: ${email}`);

      const customer = await this.customerServiceImpl?.findByEmail(email);

      if (!customer) {
        res
          .status(HttpStatus.NOT_FOUND.code)
          .send(
            new ResponseTemplate(
              HttpStatus.NOT_FOUND.code,
              'Not Found',
              'Customer not found',
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
            'Customer retrieved successfully',
            customer,
          ),
        );

      logger.info(`✅ [CustomerController] Customer retrieved: ${email}`);
    } catch (error) {
      logger.error(
        `❌ [CustomerController] Error retrieving customer by email:`,
        { error },
      );
      next(error);
    }
  };
}
