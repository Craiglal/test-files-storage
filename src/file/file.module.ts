import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from '../folder/entities/folder.entity';
import { File } from './entities/file.entity';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [TypeOrmModule.forFeature([File, Folder])],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
