import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, QueryFailedError, Repository } from 'typeorm';
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

  async listChildren(ownerId: string, parentId?: string | null): Promise<Folder[]> {
    const parentClause = parentId ?? IsNull();
    return this.folderRepository.find({
      where: { ownerId, parentId: parentClause },
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

  async getContents(ownerId: string, folderId?: string | null): Promise<{ folders: Folder[]; files: File[] }> {
    const parentClause = folderId && folderId !== 'root' ? folderId : null;

    if (folderId && folderId !== 'root') {
      const exists = await this.folderRepository.findOne({ where: { id: folderId, ownerId } });
      if (!exists) {
        throw new NotFoundException('Folder not found');
      }
    }

    const [folders, files] = await Promise.all([
      this.folderRepository.find({ where: { ownerId, parentId: parentClause ?? IsNull() }, order: { name: 'ASC' } }),
      this.fileRepository
        .createQueryBuilder('file')
        .where('(file.ownerId = :ownerId OR file.isPublic = true)', { ownerId })
        .andWhere(parentClause === null ? 'file.folderId IS NULL' : 'file.folderId = :folderId', parentClause === null ? {} : { folderId: parentClause })
        .orderBy('file.originalName', 'ASC')
        .getMany(),
    ]);

    return { folders, files };
  }

  async searchByName(ownerId: string, term: string): Promise<{ folders: Folder[]; files: File[] }> {
    const q = term?.trim();
    if (!q) {
      throw new BadRequestException('Search term is required');
    }

    const [folders, files] = await Promise.all([
      this.folderRepository.find({
        where: { ownerId, name: ILike(`%${q}%`) },
        order: { name: 'ASC' },
        take: 50,
      }),
      this.fileRepository
        .createQueryBuilder('file')
        .where('(file.ownerId = :ownerId OR file.isPublic = true)', { ownerId })
        .andWhere('file.originalName ILIKE :term', { term: `%${q}%` })
        .orderBy('file.updatedAt', 'DESC')
        .limit(50)
        .getMany(),
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
        throw new BadRequestException('A folder with this name already exists at this level');
      }
      throw err;
    }
  }
}
