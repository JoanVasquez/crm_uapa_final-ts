import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Bill } from './Bill';

/**
 * 👤 Customer Entity - Represents a customer in the system.
 * - Stores customer details including name, contact info, and related bills.
 */
@Entity('customers')
export class Customer {
  /**
   * 🔑 Primary Key - Auto-generated unique identifier for the customer.
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * 📧 Email - Unique email address of the customer.
   * - Ensures uniqueness in the database.
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  /**
   * 🏷️ First Name - The customer's first name.
   */
  @Column({ type: 'varchar', length: 255 })
  first_name!: string;

  /**
   * 🏷️ Last Name - The customer's last name.
   */
  @Column({ type: 'varchar', length: 255 })
  last_name!: string;

  /**
   * 🏠 Address - The customer's physical address (optional).
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  address?: string;

  /**
   * 📞 Phone Number - The customer's contact number (optional).
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phonenumber?: string;

  /**
   * 🧾 Bills - List of bills associated with this customer.
   * - Uses cascade to manage bill creation/deletion properly.
   */
  @OneToMany(() => Bill, (bill) => bill.customer, { cascade: true })
  bills!: Bill[];
}
