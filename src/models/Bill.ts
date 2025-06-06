import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Sale } from './Sale';
import { Customer } from './Customer';

/**
 * 🧾 Bill Entity - Represents a sales invoice.
 * - Contains details about the customer, transaction date, total amount, and associated sales.
 */
@Entity('bills')
export class Bill {
  /**
   * 🔑 Primary Key - Auto-generated unique identifier for the bill.
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * 👤 Customer - The customer associated with this bill.
   * - Required relationship (`nullable: false`).
   */
  @ManyToOne(() => Customer, (customer) => customer.bills, { nullable: false })
  customer!: Customer;

  /**
   * 📅 Date - The timestamp when the bill was created.
   * - Automatically assigned.
   */
  @CreateDateColumn()
  date!: Date;

  /**
   * 💰 Total Amount - The total value of the bill.
   * - Stored as a decimal with precision `10,2` (e.g., 99999999.99).
   * - Defaults to `0.0`.
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  total_amount!: number;

  /**
   * 📦 Sales - List of sales associated with this bill.
   * - Uses cascade to ensure related sales are properly managed.
   */
  @OneToMany(() => Sale, (sale) => sale.bill, { cascade: true })
  sales!: Sale[];

  toJSON() {
    return {
      id: this.id,
      customer: this.customer,
      date: this.date,
      total_amount: this.total_amount,
      sales: this.sales?.map((sale) => ({
        id: sale.id,
        product: sale.product.name,
        quantity: sale.quantity,
        sale_price: sale.sale_price,
      })),
    };
  }
}
