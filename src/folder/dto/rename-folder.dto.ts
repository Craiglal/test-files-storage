import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RenameFolderDto {
  @ApiProperty({ maxLength: 255, description: 'New folder name' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;
}
