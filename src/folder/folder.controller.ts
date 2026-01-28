import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateFolderDto } from './dto/create-folder.dto';
import { RenameFolderDto } from './dto/rename-folder.dto';
import { FolderService } from './folder.service';
import { Folder } from './entities/folder.entity';
import { File } from '../file/entities/file.entity';

@ApiTags('folders')
@ApiExtraModels(Folder, File)
@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) { }

  @Post()
  @ApiOperation({ summary: 'Create folder', description: 'Create a folder under an optional parent for a given owner.' })
  @ApiCreatedResponse({
    description: 'Folder created.',
    schema: { $ref: getSchemaPath(Folder) },
  })
  @ApiBadRequestResponse({ description: 'Parent not found or validation failed.' })
  @ApiBody({ type: CreateFolderDto })
  create(@Body() dto: CreateFolderDto) {
    return this.folderService.createFolder(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search folders and files by name' })
  @ApiQuery({ name: 'ownerId', required: true, description: 'Owner id (uuid)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term applied to folder and file names' })
  @ApiOkResponse({
    description: 'Matching folders and files',
    schema: {
      type: 'object',
      properties: {
        folders: { type: 'array', items: { $ref: getSchemaPath(Folder) } },
        files: { type: 'array', items: { $ref: getSchemaPath(File) } },
      },
    },
  })
  search(@Query('ownerId') ownerId: string, @Query('q') q: string) {
    return this.folderService.searchByName(ownerId, q);
  }

  @Get(':id/contents')
  @ApiOperation({ summary: 'Get folder contents (child folders and files)' })
  @ApiParam({ name: 'id', description: 'Folder id or "root" for top-level' })
  @ApiQuery({ name: 'ownerId', required: true, description: 'Owner id (uuid)' })
  @ApiOkResponse({
    description: 'Child folders and files',
    schema: {
      type: 'object',
      properties: {
        folders: {
          type: 'array',
          items: { $ref: getSchemaPath(Folder) },
        },
        files: {
          type: 'array',
          items: { $ref: getSchemaPath(File) },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Folder not found' })
  async getContents(@Param('id') id: string, @Query('ownerId') ownerId: string) {
    return this.folderService.getContents(ownerId, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get folder', description: 'Fetch a single folder by id.' })
  @ApiOkResponse({ description: 'Folder found.', schema: { $ref: getSchemaPath(Folder) } })
  @ApiNotFoundResponse({ description: 'Folder not found.' })
  getOne(@Param('id') id: string) {
    return this.folderService.getFolder(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'List child folders', description: 'List children of the given folder id.' })
  @ApiQuery({ name: 'ownerId', required: true, description: 'Owner id (uuid)' })
  @ApiOkResponse({
    description: 'Child folders list.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(Folder) },
    },
  })
  listChildren(@Param('id') id: string, @Query('ownerId') ownerId: string) {
    return this.folderService.listChildren(ownerId, id);
  }

  @Get()
  @ApiOperation({ summary: 'List root folders', description: 'List folders without a parent.' })
  @ApiQuery({ name: 'ownerId', required: true, description: 'Owner id (uuid)' })
  @ApiOkResponse({
    description: 'Root folders list.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(Folder) },
    },
  })
  listRoots(@Query('ownerId') ownerId: string) {
    return this.folderService.listChildren(ownerId, null);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete folder', description: 'Delete a folder and cascade delete its descendants and files.' })
  @ApiOkResponse({ description: 'Folder deleted.', schema: { type: 'object', properties: { affected: { type: 'number' } } } })
  @ApiNotFoundResponse({ description: 'Folder not found.' })
  remove(@Param('id') id: string) {
    return this.folderService.removeFolder(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename folder', description: 'Rename a folder; name must be unique among siblings.' })
  @ApiOkResponse({ description: 'Folder renamed.', schema: { $ref: getSchemaPath(Folder) } })
  @ApiNotFoundResponse({ description: 'Folder not found.' })
  @ApiBadRequestResponse({ description: 'Validation failed or duplicate name among siblings.' })
  @ApiBody({ type: RenameFolderDto })
  rename(@Param('id') id: string, @Body() dto: RenameFolderDto) {
    return this.folderService.renameFolder(id, dto);
  }
}
