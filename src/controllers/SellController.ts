import { autoInjectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import ResponseTemplate from '../utils/response.template';
import { SellService } from '../services/SellService';
import httpStatus from '../utils/http.status';
import logger from '../utils/logger';
import { Sale } from '../models/Sale';
import { ICRUD } from '../services/ICRUD';
import BaseController from './BaseController';

/**
 * 🛍️ SellController - Handles API requests related to sales.
 * - Processes a sale transaction by creating a new customer, bill, and sales.
 * - Calls `SellService` to manage business logic.
 */
@autoInjectable()
export default class SellController extends BaseController {
  constructor(
    @inject('SellService') protected sellService?: ICRUD<Sale>,
    @inject('SellServiceImpl') private readonly sellServiceImpl?: SellService,
  ) {
    super(sellService!);
    this.sellServiceImpl = sellServiceImpl;

    delete this.save;
    delete this.update;
    delete this.delete;
  }

  /**
   * 🛒 Processes a sale transaction.
   * - Receives customer details and sales data.
   * - Calls `SellService.processSale` to create the customer, bill, and sales.
   * - Returns the newly created bill with associated sales.
   */
  processSales = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const sale = req.body;

      logger.info(`🛒 [SellController] Processing sale`);

      const isSaleProcessed = await this.sellServiceImpl?.processSales(sale);

      res
        .status(httpStatus.CREATED.code)
        .send(
          new ResponseTemplate(
            httpStatus.CREATED.code,
            httpStatus.CREATED.status,
            'Sale processed successfully',
            isSaleProcessed,
          ),
        );
    } catch (error) {
      logger.error(`❌ [SellController] Sale processing failed`, { error });
      next(error);
    }
  };
}
