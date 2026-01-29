import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IsNull, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { File } from './entities/file.entity';
import { CreateUploadRequestDto, MAX_FILE_BYTES } from './dto/create-upload-request.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { RenameFileDto } from './dto/rename-file.dto';
import { Folder } from '../folder/entities/folder.entity';

const PART_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FileService {
  private readonly s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  });

  private readonly bucket = process.env.S3_BUCKET || '';

  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    @InjectRepository(Folder)
    private readonly folderRepo: Repository<Folder>,
  ) { }

  private buildStorageKey(ownerId: string, fileId: string, version: number) {
    return `u/${ownerId}/file/${fileId}/v/${version}`;
  }

  private buildContentDisposition(fileName: string) {
    const safeName = fileName.replace(/[^ -~]/g, '_');
    const encoded = encodeURIComponent(fileName);
    return `attachment; filename="${safeName}"; filename*=UTF-8''${encoded}`;
  }

  private assertSizeWithinLimit(size: unknown) {
    const num = Number(size);
    if (!Number.isFinite(num) || num <= 0) {
      throw new BadRequestException('Invalid file size');
    }
    if (num > MAX_FILE_BYTES) {
      throw new BadRequestException('File exceeds 2GB limit');
    }
    return num;
  }

  async createUploadRequest(dto: CreateUploadRequestDto) {
    if (!this.bucket) {
      throw new BadRequestException('S3 bucket is not configured');
    }

    const size = this.assertSizeWithinLimit(dto.size);
    const isPublic = dto.isPublic ?? false;

    let folder: Folder | null = null;
    if (dto.folderId) {
      folder = await this.folderRepo.findOne({ where: { id: dto.folderId } });
      if (!folder) {
        throw new BadRequestException('Folder not found');
      }
    }

    const id = randomUUID();
    const version = 1;
    const storageKey = this.buildStorageKey(dto.ownerId, id, version);

    const file = this.fileRepo.create({
      id,
      ownerId: dto.ownerId,
      folderId: dto.folderId ?? null,
      originalName: dto.originalName,
      mime: dto.mime,
      size: size.toString(),
      storageKey,
      checksum: dto.checksum ?? null,
      version,
      isPublic,
      folder,
    });

    await this.fileRepo.save(file);

    const createResponse = await this.s3.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: storageKey,
        ContentType: dto.mime,
      }),
    );

    if (!createResponse.UploadId) {
      throw new InternalServerErrorException('Failed to start upload');
    }

    const totalParts = Math.ceil(size / PART_SIZE) || 1;

    const parts = await Promise.all(
      Array.from({ length: totalParts }, async (_v, idx) => {
        const partNumber = idx + 1;
        const url = await getSignedUrl(
          this.s3,
          new UploadPartCommand({
            Bucket: this.bucket,
            Key: storageKey,
            PartNumber: partNumber,
            UploadId: createResponse.UploadId,
          }),
          { expiresIn: 900 },
        );

        return { partNumber, url };
      }),
    );

    return {
      fileId: id,
      uploadId: createResponse.UploadId,
      storageKey,
      partSize: PART_SIZE,
      parts,
    };
  }

  async listFiles(ownerId: string, folderId?: string | null) {
    if (folderId) {
      const folder = await this.folderRepo.findOne({ where: { id: folderId } });
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
    }

    const qb = this.fileRepo
      .createQueryBuilder('file')
      .where('(file.ownerId = :ownerId OR file.isPublic = true)', { ownerId })
      .orderBy('file.updatedAt', 'DESC');

    if (folderId === null) {
      qb.andWhere('file.folderId IS NULL');
    } else if (folderId) {
      qb.andWhere('file.folderId = :folderId', { folderId });
    } else {
      qb.andWhere('file.folderId IS NULL');
    }

    return qb.getMany();
  }

  async listPublicFiles(folderId?: string | null) {
    if (folderId) {
      const folder = await this.folderRepo.findOne({ where: { id: folderId } });
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
    }

    const folderClause = folderId ? folderId : IsNull();
    return this.fileRepo.find({
      where: { folderId: folderClause, isPublic: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async completeUpload(dto: CompleteUploadDto) {
    const file = await this.fileRepo.findOne({ where: { id: dto.fileId } });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (!dto.parts?.length) {
      throw new BadRequestException('No parts supplied');
    }

    const parts = [...dto.parts]
      .map((p) => ({ ETag: p.ETag, PartNumber: Number(p.partNumber) }))
      .sort((a, b) => a.PartNumber - b.PartNumber);

    await this.s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: file.storageKey,
        UploadId: dto.uploadId,
        MultipartUpload: { Parts: parts },
      }),
    );

    return { ok: true };
  }

  async renameFile(id: string, dto: RenameFileDto) {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    file.originalName = dto.name;
    await this.fileRepo.save(file);
    return file;
  }

  async deleteFile(id: string) {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (!this.bucket) {
      throw new BadRequestException('S3 bucket is not configured');
    }

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: file.storageKey,
      }),
    );

    await this.fileRepo.delete({ id: file.id });

    return { ok: true };
  }

  async getDownloadUrl(id: string, requesterId?: string) {
    if (!this.bucket) {
      throw new BadRequestException('S3 bucket is not configured');
    }

    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (!file.isPublic) {
      if (!requesterId || file.ownerId !== requesterId) {
        throw new NotFoundException('File not found');
      }
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: file.storageKey,
      ResponseContentDisposition: this.buildContentDisposition(file.originalName),
      ResponseContentType: file.mime || undefined,
    });
    const url = await getSignedUrl(this.s3, command, { expiresIn: 900 });

    return { url, fileName: file.originalName, mime: file.mime, size: file.size };
  }
}
