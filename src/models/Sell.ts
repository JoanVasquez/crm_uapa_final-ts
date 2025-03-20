import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Bill } from './Bill';
import { Product } from './Product';

/**
 * 🛍️ Sell Entity - Represents a sales transaction.
 * - Stores details of the bill, product sold, quantity, and sale price.
 */
@Entity('sells')
export class Sell {
  /**
   * 🔑 Primary Key - Auto-generated unique identifier for the sale.
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * 🧾 Bill - The bill associated with this sale.
   * - Required relationship (`nullable: false`).
   */
  @ManyToOne(() => Bill, (bill) => bill.sells, { nullable: false })
  bill!: Bill;

  /**
   * 📦 Product - The product being sold.
   * - Required relationship (`nullable: false`).
   */
  @ManyToOne(() => Product, (product) => product.sells, { nullable: false })
  product!: Product;

  /**
   * 🔢 Quantity - Number of product units sold.
   */
  @Column({ type: 'int' })
  quantity!: number;

  /**
   * 💰 Sale Price - Price at which the product was sold.
   * - Stored as a decimal with precision `10,2` (e.g., 99999999.99).
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  sale_price!: number;
}
