import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateFolderDto } from './dto/create-folder.dto';
import { RenameFolderDto } from './dto/rename-folder.dto';
import { FolderService } from './folder.service';
import { Folder } from './entities/folder.entity';

@ApiTags('folders')
@ApiExtraModels(Folder)
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

  @Get(':id')
  @ApiOperation({ summary: 'Get folder', description: 'Fetch a single folder by id.' })
  @ApiOkResponse({ description: 'Folder found.', schema: { $ref: getSchemaPath(Folder) } })
  @ApiNotFoundResponse({ description: 'Folder not found.' })
  getOne(@Param('id') id: string) {
    return this.folderService.getFolder(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'List child folders', description: 'List children of the given folder id.' })
  @ApiOkResponse({
    description: 'Child folders list.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(Folder) },
    },
  })
  listChildren(@Param('id') id: string) {
    return this.folderService.listChildren(id);
  }

  @Get()
  @ApiOperation({ summary: 'List root folders', description: 'List folders without a parent.' })
  @ApiOkResponse({
    description: 'Root folders list.',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(Folder) },
    },
  })
  listRoots() {
    return this.folderService.listChildren(null);
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
