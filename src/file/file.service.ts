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
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { File } from './entities/file.entity';
import { CreateUploadRequestDto, MAX_FILE_BYTES } from './dto/create-upload-request.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
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
  ) {}

  private buildStorageKey(ownerId: string, fileId: string, version: number) {
    return `u/${ownerId}/file/${fileId}/v/${version}`;
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
}
