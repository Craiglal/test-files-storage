import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  picture?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @UpdateDateColumn({ default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
