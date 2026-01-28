import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsMimeType, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

export class CreateUploadRequestDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Target folder id; omit for root upload' })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiProperty({ format: 'uuid', description: 'Owner id' })
  @IsUUID()
  ownerId!: string;

  @ApiProperty({ maxLength: 255, description: 'Original file name' })
  @IsString()
  @Length(1, 255)
  originalName!: string;

  @ApiProperty({ description: 'MIME type' })
  @IsMimeType()
  mime!: string;

  @ApiProperty({ minimum: 1, maximum: MAX_FILE_BYTES, description: 'File size in bytes' })
  @Min(1)
  @Max(MAX_FILE_BYTES)
  size!: number;

  @ApiPropertyOptional({ description: 'Optional checksum (e.g., md5/sha256)', maxLength: 255 })
  @IsOptional()
  @IsString()
  checksum?: string;

  @ApiPropertyOptional({ description: 'Mark file as public', default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
