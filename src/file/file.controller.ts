import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { CreateUploadRequestDto } from './dto/create-upload-request.dto';
import { FileService } from './file.service';
import { File } from './entities/file.entity';
import { UploadPartDto } from './dto/complete-upload.dto';
import { RenameFileDto } from './dto/rename-file.dto';

@ApiTags('files')
@ApiBearerAuth()
@ApiExtraModels(File, CreateUploadRequestDto, CompleteUploadDto, UploadPartDto)
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Get('public')
  @ApiOperation({ summary: 'List public files', description: 'List files marked as public, optionally filtered by folder id (omit or use "root" for top-level).' })
  @ApiQuery({ name: 'folderId', required: false, description: 'Folder id; omit or use "root" for top-level' })
  @ApiOkResponse({ description: 'Public files list', schema: { type: 'array', items: { $ref: getSchemaPath(File) } } })
  @ApiNotFoundResponse({ description: 'Folder not found.' })
  listPublicFiles(@Query('folderId') folderId?: string) {
    const normalizedFolder = folderId === 'root' ? null : folderId;
    return this.fileService.listPublicFiles(normalizedFolder);
  }

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

  @Patch(':id')
  @ApiOperation({ summary: 'Rename file', description: 'Rename a file without reuploading.' })
  @ApiOkResponse({ description: 'File renamed.', schema: { $ref: getSchemaPath(File) } })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiBody({ schema: { $ref: getSchemaPath(RenameFileDto) } })
  renameFile(@Param('id') id: string, @Body() dto: RenameFileDto) {
    return this.fileService.renameFile(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete file', description: 'Deletes the file and removes its object from storage.' })
  @ApiOkResponse({ description: 'File deleted.', schema: { type: 'object', properties: { ok: { type: 'boolean' } } } })
  @ApiBadRequestResponse({ description: 'File not found or bucket not configured.' })
  removeFile(@Param('id') id: string) {
    return this.fileService.deleteFile(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get download URL', description: 'Returns a presigned URL to download the file (owner or public files only).' })
  @ApiQuery({ name: 'ownerId', required: false, description: 'Requester owner id; required for private files.' })
  @ApiOkResponse({
    description: 'Presigned download URL',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        fileName: { type: 'string' },
        mime: { type: 'string' },
        size: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Bucket not configured.' })
  @ApiNotFoundResponse({ description: 'File not found or access denied.' })
  getDownloadUrl(@Param('id') id: string, @Query('ownerId') ownerId?: string) {
    return this.fileService.getDownloadUrl(id, ownerId);
  }

  @Get()
  @ApiOperation({ summary: 'List files', description: 'List files for an owner, optionally filtered by folder id (omit or use "root" for top-level).' })
  @ApiQuery({ name: 'ownerId', required: true, description: 'Owner id (uuid)' })
  @ApiQuery({ name: 'folderId', required: false, description: 'Folder id; omit or use "root" for top-level' })
  @ApiOkResponse({ description: 'Files list', schema: { type: 'array', items: { $ref: getSchemaPath(File) } } })
  @ApiNotFoundResponse({ description: 'Folder not found.' })
  listFiles(@Query('ownerId') ownerId: string, @Query('folderId') folderId?: string) {
    const normalizedFolder = folderId === 'root' ? null : folderId;
    return this.fileService.listFiles(ownerId, normalizedFolder);
  }
}
