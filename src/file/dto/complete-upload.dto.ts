import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadPartDto {
  @ApiProperty({ description: 'ETag returned from S3 for the uploaded part' })
  @IsString()
  ETag!: string;

  @ApiProperty({ minimum: 1, description: 'Part number (1-based)' })
  @IsInt()
  @Min(1)
  partNumber!: number;
}

export class CompleteUploadDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fileId!: string;

  @ApiProperty()
  @IsString()
  uploadId!: string;

  @ApiProperty({ type: () => UploadPartDto, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UploadPartDto)
  parts!: UploadPartDto[];
}
