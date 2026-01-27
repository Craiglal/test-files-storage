import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateFolderDto {
  @ApiProperty({ maxLength: 255, description: 'Folder name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @ApiProperty({ format: 'uuid', description: 'Owner id' })
  @IsUUID()
  ownerId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Parent folder id; omit for root folder' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
