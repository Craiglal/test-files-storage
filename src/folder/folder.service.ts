import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { CreateFolderDto } from './dto/create-folder.dto';
import { RenameFolderDto } from './dto/rename-folder.dto';
import { Folder } from './entities/folder.entity';
import { File } from '../file/entities/file.entity';

@Injectable()
export class FolderService {
  constructor(
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) { }

  async createFolder(dto: CreateFolderDto): Promise<Folder> {
    let parent: Folder | null = null;

    if (dto.parentId) {
      parent = await this.folderRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Parent folder not found');
      }
    }

    const folder = this.folderRepository.create({
      name: dto.name,
      ownerId: dto.ownerId,
      parentId: dto.parentId ?? null,
      parent,
    });

    return this.folderRepository.save(folder);
  }

  async listChildren(parentId?: string | null): Promise<Folder[]> {
    const parentClause = parentId ?? IsNull();
    return this.folderRepository.find({
      where: { parentId: parentClause },
      order: { name: 'ASC' },
    });
  }

  async getFolder(id: string): Promise<Folder> {
    const folder = await this.folderRepository.findOne({ where: { id } });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }
    return folder;
  }

  async getContents(folderId?: string | null) {
    const parentClause = folderId && folderId !== 'root' ? folderId : IsNull();

    if (folderId && folderId !== 'root') {
      const exists = await this.folderRepository.findOne({ where: { id: folderId } });
      if (!exists) {
        throw new NotFoundException('Folder not found');
      }
    }

    const [folders, files] = await Promise.all([
      this.folderRepository.find({ where: { parentId: parentClause }, order: { name: 'ASC' } }),
      this.fileRepository.find({ where: { folderId: parentClause }, order: { originalName: 'ASC' } }),
    ]);

    return { folders, files };
  }

  async removeFolder(id: string): Promise<void> {
    const existing = await this.folderRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Folder not found');
    }

    await this.folderRepository.delete({ id });
  }

  async renameFolder(id: string, dto: RenameFolderDto): Promise<Folder> {
    const folder = await this.folderRepository.findOne({ where: { id } });
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    folder.name = dto.name;

    try {
      return await this.folderRepository.save(folder);
    } catch (err) {
      if (err instanceof QueryFailedError && (err as any).code === '23505') {
        // Unique constraint on (ownerId, parentId, name)
        throw new BadRequestException('A folder with this name already exists at this level');
      }
      throw err;
    }
  }
}
