import { Sale } from '../models/Sale';
import { Bill } from '../models/Bill';
import { Customer } from '../models/Customer';
import { SellRepository } from '../repositories/SellRepository';
import { BillRepository } from '../repositories/BillRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { GenericService } from './GenericService';
import { Cache } from '../utils/cacheUtil';
import logger from '../utils/logger';
import { inject, injectable } from 'tsyringe';
import { BaseAppException } from '../errors/BaseAppException';
import { uploadFile } from '../utils/s3Util';
import { customer_receipt } from '../email_templates/templates';
import { ProductRepository } from '../repositories/ProductRepository';
import { getCachedParameter } from '../utils/ssmUtil';

export interface ProcessSalesDTO {
  customerId: number;
  sales: Array<{
    productId: number;
    quantity: number;
    sale_price: number;
  }>;
}

@injectable()
export class SellService extends GenericService<Sale> {
  constructor(
    @inject('Cache') protected readonly cache: Cache,
    @inject('SellRepository') private readonly sellRepository: SellRepository,
    @inject('BillRepository') private readonly billRepository: BillRepository,
    @inject('CustomerRepository')
    private readonly customerRepository: CustomerRepository,
    @inject('ProductRepository')
    private readonly productRepository: ProductRepository,
  ) {
    super(cache, sellRepository, Sale);
    logger.info('✅ [SellService] Initialized SellService');
    this.sellRepository = sellRepository;
    this.billRepository = billRepository;
    this.customerRepository = customerRepository;
    this.productRepository = productRepository;
  }

  async processSales(salesDTO: ProcessSalesDTO): Promise<boolean> {
    logger.info('🚀 Starting processSales...');

    // 1️⃣ Retrieve the customer
    const customer: Customer | null =
      await this.customerRepository.findEntityById(salesDTO.customerId);
    if (!customer) {
      logger.error('❌ Customer not found with id: %s', salesDTO.customerId);
      throw new BaseAppException('Customer not found');
    }
    logger.info(
      '👤 Found customer: %s %s',
      customer.first_name,
      customer.last_name,
    );

    // 2️⃣ Create a new Bill for the customer
    const bill = new Bill();
    bill.customer = customer;
    bill.total_amount = 0;
    bill.sales = [];
    logger.info('🧾 New bill created for customer');

    // 3️⃣ Process each sale item
    for (const saleDTO of salesDTO.sales) {
      logger.info(
        '🔍 Processing sale item for product id: %s',
        saleDTO.productId,
      );

      const product = await this.productRepository.findEntityById(
        saleDTO.productId,
      );
      if (!product) {
        logger.error('❌ Product not found with id: %s', saleDTO.productId);
        throw new BaseAppException(
          `Product with id ${saleDTO.productId} not found`,
        );
      }
      logger.info('📦 Found product: %s', product.name);

      if (product.available_quantity < saleDTO.quantity) {
        logger.error('❌ Insufficient stock for product: %s', product.name);
        throw new BaseAppException(
          `Insufficient stock for product ${product.name}`,
        );
      }

      // Update product stock
      product.available_quantity -= saleDTO.quantity;
      await this.productRepository.updateEntity(saleDTO.productId, product);
      logger.info(
        '✅ Updated stock for product %s, new quantity: %s',
        product.name,
        product.available_quantity,
      );

      // Create and add Sale
      const sale = new Sale();
      sale.bill = bill;
      sale.product = product;
      sale.quantity = saleDTO.quantity;
      sale.sale_price = saleDTO.sale_price;
      bill.sales.push(sale);
      bill.total_amount += sale.sale_price * sale.quantity;
      logger.info(
        '🛍️ Added sale item: %s units of %s at $%s each',
        sale.quantity,
        product.name,
        sale.sale_price,
      );
    }

    // 4️⃣ Save the Bill (cascading the sales)
    const savedBill = await this.billRepository.createEntity(bill);

    if (!savedBill) {
      logger.error('❌ Error saving bill');
      throw new BaseAppException('Error saving bill');
    }

    logger.info(
      '💾 Bill saved with id: %s, Total amount: $%s',
      savedBill.id,
      savedBill.total_amount,
    );

    // 5️⃣ Generate a receipt and upload it to S3
    const billHtml = customer_receipt(savedBill);
    const fileName = `${customer.first_name}-${customer.last_name}-bill-${savedBill.date.toISOString()}.html`;
    const contentType = 'text/html';
    const bucket = await getCachedParameter(process.env.S3_BUCKET_BILL!);
    await uploadFile(fileName, Buffer.from(billHtml), contentType, bucket);
    logger.info('☁️ Receipt uploaded to S3: %s', fileName);

    // 7️⃣ Cache the saved bill
    await this.cache.set(
      `bill:${savedBill.id}`,
      JSON.stringify(savedBill),
      3600,
    );
    logger.info('🔒 Bill cached with key: bill:%s', savedBill.id);

    logger.info('🎉 processSales completed successfully.');
    return true;
  }
}
