import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Sale } from './Sale';

/**
 * 📦 Product Entity - Represents a product in the inventory.
 * - Stores details such as name, description, price, stock quantity, and related sales.
 */
@Entity('products')
export class Product {
  /**
   * 🔑 Primary Key - Auto-generated unique identifier for the product.
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * 🏷️ Name - Unique name of the product.
   * - Ensures uniqueness in the database.
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  /**
   * 📝 Description - Optional description of the product.
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * 💰 Price - The cost of the product.
   * - Stored as a decimal with precision `10,2` (e.g., 99999999.99).
   */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  /**
   * 📊 Available Quantity - Number of items in stock.
   * - Defaults to `0` if not specified.
   */
  @Column({ type: 'int', default: 0 })
  available_quantity!: number;

  /**
   * 🛍️ Sales - List of sales transactions related to this product.
   * - Uses cascade to ensure related sales are properly managed.
   */
  @OneToMany(() => Sale, (sale) => sale.product, { cascade: true })
  sales!: Sale[];
}
