import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * 🏷️ UserRole - Enum for defining user roles.
 * - `ADMIN`: Administrative user with full privileges.
 * - `SELLER`: Regular user (seller) with restricted permissions.
 */
export enum UserRole {
  // eslint-disable-next-line no-unused-vars
  ADMIN = 'admin',
  // eslint-disable-next-line no-unused-vars
  SELLER = 'seller',
}

/**
 * 👤 User Entity - Represents a system user.
 * - Stores user authentication details and role-based access control.
 */
@Entity('users')
export class User {
  /**
   * 🔑 Primary Key - Auto-generated unique identifier for the user.
   */
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * 📧 Email - Unique email address of the user.
   * - Ensures uniqueness in the database.
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  /**
   * 🏷️ Username - Unique username for login.
   * - Ensures uniqueness in the database.
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  username!: string;

  /**
   * 🔒 Password - Encrypted password for authentication.
   * - `select: false` prevents it from being retrieved in queries by default.
   */
  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  /**
   * ✅ Account Status - Determines if the user is active.
   * - Defaults to `true` (active).
   */
  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  /**
   * 🎭 Role - Defines the user's role (`admin` or `seller`).
   * - Stored as an `enum` in the database.
   * - Defaults to `UserRole.USER` (seller).
   */
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.SELLER,
  })
  role!: UserRole;
}
