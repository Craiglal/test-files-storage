import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Folder } from '../../folder/entities/folder.entity';

@Entity({ name: 'files' })
@Index(['ownerId', 'folderId', 'originalName'])
export class File {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  ownerId!: string;

  @Column({ type: 'uuid', nullable: true })
  folderId?: string | null;

  @ManyToOne(() => Folder, (folder) => folder.files, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'folderId' })
  folder?: Folder | null;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 255 })
  mime!: string;

  @Column('bigint')
  size!: string;

  @Column({ type: 'varchar', length: 512 })
  storageKey!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  checksum?: string | null;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
