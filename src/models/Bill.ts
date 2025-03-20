import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Sell } from './Sell';
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
  @OneToMany(() => Sell, (sell) => sell.bill, { cascade: true })
  sells!: Sell[];
}
