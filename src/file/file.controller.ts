import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { CreateUploadRequestDto } from './dto/create-upload-request.dto';
import { FileService } from './file.service';
import { File } from './entities/file.entity';
import { UploadPartDto } from './dto/complete-upload.dto';

@ApiTags('files')
@ApiBearerAuth()
@ApiExtraModels(File, CreateUploadRequestDto, CompleteUploadDto, UploadPartDto)
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload-request')
  @ApiOperation({
    summary: 'Start multipart upload',
    description:
      'Creates a File record, returns presigned URLs for multipart upload (10 MB parts) and the storage key.',
  })
  @ApiCreatedResponse({
    description: 'Upload initialized; client should upload all parts then call /files/complete.',
    schema: {
      type: 'object',
      properties: {
        fileId: { type: 'string', format: 'uuid' },
        uploadId: { type: 'string' },
        storageKey: { type: 'string' },
        partSize: { type: 'number' },
        parts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partNumber: { type: 'number' },
              url: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed, bucket not configured, folder not found, or file exceeds 2GB.',
  })
  @ApiBody({ schema: { $ref: getSchemaPath(CreateUploadRequestDto) } })
  createUploadRequest(@Body() dto: CreateUploadRequestDto) {
    return this.fileService.createUploadRequest(dto);
  }

  @Post('complete')
  @ApiOperation({
    summary: 'Complete multipart upload',
    description: 'Completes the multipart upload using collected ETags for each part.',
  })
  @ApiOkResponse({ description: 'Upload completed.', schema: { type: 'object', properties: { ok: { type: 'boolean' } } } })
  @ApiBadRequestResponse({ description: 'No parts supplied or invalid request.' })
  @ApiBody({ schema: { $ref: getSchemaPath(CompleteUploadDto) } })
  completeUpload(@Body() dto: CompleteUploadDto) {
    return this.fileService.completeUpload(dto);
  }
}
