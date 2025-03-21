import { Sell } from '../models/Sell';
import { Bill } from '../models/Bill';
import { Customer } from '../models/Customer';
import { SellRepository } from '../repositories/SellRepository';
import { BillRepository } from '../repositories/BillRepository';
import { CustomerRepository } from '../repositories/CustomerRepository';
import { ProductService } from '../services/ProductService';
import { GenericService } from './GenericService';
import { Cache } from '../utils/cacheUtil';
import logger from '../utils/logger';
import { inject, injectable } from 'tsyringe';
import { BaseAppException } from '../errors/BaseAppException';
import { uploadFile } from '../utils/s3Util'; // S3 utility
import { sendEmail } from '../utils/sesUtil'; // SES utility
import { customer_receipt } from '../email_templates/templates'; // hypothetical utility to format bill

@injectable()
export class SellService extends GenericService<Sell> {
  constructor(
    @inject('Cache') protected readonly cache: Cache,
    @inject('SellRepository') private readonly sellRepository: SellRepository,
    @inject('BillRepository') private readonly billRepository: BillRepository,
    @inject('CustomerRepository')
    private readonly customerRepository: CustomerRepository,
    @inject('ProductService') private readonly productService: ProductService,
  ) {
    super(cache, sellRepository, Sell);
    logger.info('✅ [SellService] Initialized SellService');
    this.sellRepository = sellRepository;
    this.billRepository = billRepository;
    this.customerRepository = customerRepository;
    this.productService = productService;
  }

  async processSale(
    customerData: Omit<Customer, 'id' | 'bills'>,
    sales: { productId: number; quantity: number; salePrice: number }[],
  ): Promise<Bill> {
    logger.info(
      `🛒 [SellService] Processing sale for new customer: ${customerData.email}`,
    );

    const newCustomer = new Customer();
    Object.assign(newCustomer, customerData);
    const savedCustomer =
      await this.customerRepository.createEntity(newCustomer);

    const newBill = new Bill();
    newBill.customer = savedCustomer!;
    newBill.total_amount = 0;
    newBill.sells = [];

    const savedBill = await this.billRepository.createEntity(newBill);

    let totalAmount = 0;

    for (const sale of sales) {
      const product = await this.productService.findById(sale.productId);
      if (!product || product.available_quantity < sale.quantity) {
        throw new BaseAppException(
          `❌ Insufficient stock or invalid product ID: ${sale.productId}`,
        );
      }

      const newSell = new Sell();
      newSell.bill = savedBill!;
      newSell.product = product;
      newSell.quantity = sale.quantity;
      newSell.sale_price = sale.salePrice;

      await this.sellRepository.createEntity(newSell);
      newBill.sells.push(newSell);

      totalAmount += sale.quantity * sale.salePrice;

      await this.productService.update(product.id, {
        available_quantity: product.available_quantity - sale.quantity,
      });
    }

    savedBill!.total_amount = totalAmount;
    const finalBill = await this.billRepository.updateEntity(savedBill!.id, {
      total_amount: totalAmount,
    });

    // 🧾 Upload the bill HTML to S3
    const billHtml = customer_receipt(finalBill!);
    const fileName = `bill-${finalBill!.id}.html`;
    const contentType = 'text/html';
    const bucket = process.env.S3_BUCKET_BILL ?? 'default-bill-bucket';
    const fileUrl = await uploadFile(
      fileName,
      Buffer.from(billHtml),
      contentType,
      bucket,
    );

    logger.info(`📤 [SellService] Bill uploaded to S3: ${fileUrl}`);

    // 📩 Email the bill
    await sendEmail(
      [savedCustomer!.email],
      `Your Purchase Receipt - Bill #${finalBill!.id}`,
      billHtml,
    );

    logger.info(
      `📧 [SellService] Bill sent to customer: ${savedCustomer!.email}`,
    );

    await this.cache.set(
      `bill:${finalBill!.id}`,
      JSON.stringify(finalBill),
      3600,
    );

    return finalBill!;
  }
}
