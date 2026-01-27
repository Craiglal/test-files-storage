import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from './entities/folder.entity';
import { File } from '../file/entities/file.entity';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Folder, File])],
  providers: [FolderService],
  controllers: [FolderController],
  exports: [FolderService, TypeOrmModule],
})
export class FolderModule { }
