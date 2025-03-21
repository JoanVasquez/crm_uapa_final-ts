import { autoInjectable, inject } from 'tsyringe';
import BaseController from './BaseController';
import { ICRUD } from '../services/ICRUD';
import logger from '../utils/logger';
import { Bill } from '../models/Bill';

/**
 * 🧾 BillController - Handles API requests related to bills.
 * - Extends `BaseController` to provide standard CRUD operations.
 * - Disables `delete`, `update`, and `save` methods to maintain data integrity.
 */
@autoInjectable()
export default class BillController extends BaseController {
  /**
   * 🏗️ Constructor - Injects `BillService` and initializes the controller.
   * @param billService - The bill service implementing `ICRUD<Bill>`.
   */
  constructor(@inject('BillService') protected billService?: ICRUD<Bill>) {
    super(billService!);
    logger.info('✅ [BillController] Initialized BillController');

    // ❌ Prevent deletion, updating, and direct creation of bills
    delete this.delete;
    delete this.update;
    delete this.save;
  }
}
