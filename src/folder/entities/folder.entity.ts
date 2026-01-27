import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { File } from '../../file/entities/file.entity';

@Entity({ name: 'folders' })
@Index(['ownerId', 'parentId', 'name'], { unique: true })
@Check('"id" IS DISTINCT FROM "parentId"')
export class Folder {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ maxLength: 255 })
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @Column('uuid')
  ownerId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @Column({ type: 'uuid', nullable: true })
  parentId?: string | null;

  @ManyToOne(() => Folder, (folder) => folder.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Folder | null;

  @OneToMany(() => Folder, (folder) => folder.parent)
  children?: Folder[];

  @OneToMany(() => File, (file) => file.folder)
  files?: File[];

  @ApiPropertyOptional({ maxLength: 1024, nullable: true })
  @Column({ type: 'varchar', length: 1024, nullable: true })
  pathCache?: string | null;

  @ApiProperty({ type: String })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ type: String })
  @UpdateDateColumn()
  updatedAt!: Date;
}
