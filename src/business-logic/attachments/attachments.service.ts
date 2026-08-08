import { Injectable } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { AttachmentKind } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { failAction, successAction } from '../../utils/action.dto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

@Injectable()
export class AttachmentsService {
  private readonly uploadTtlSeconds = 600;

  constructor(private readonly prisma: PrismaService) {}

  private getR2Config() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error('R2 configuration is incomplete');
    }

    return {
      endpoint,
      accessKeyId,
      secretAccessKey,
      bucket,
      publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
    };
  }

  private getClient() {
    const config = this.getR2Config();
    return new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  private inferKind(mimeType: string): AttachmentKind {
    if (mimeType.startsWith('audio/')) return AttachmentKind.AUDIO;
    if (mimeType.startsWith('image/')) return AttachmentKind.IMAGE;
    return AttachmentKind.DOCUMENT;
  }

  private validateUpload(dto: CreateUploadUrlDto) {
    const allowed = [
      /^image\/(png|jpeg|webp|gif)$/,
      /^audio\/(mpeg|mp3|mp4|webm|ogg|wav|x-m4a)$/,
      /^application\/pdf$/,
      /^text\/plain$/,
      /^text\/csv$/,
      /^application\/vnd\.openxmlformats-officedocument\./,
      /^application\/vnd\.ms-/,
      /^application\/msword$/,
    ];

    if (!allowed.some((pattern) => pattern.test(dto.mimeType))) {
      return 'Unsupported file type';
    }

    const kind = this.inferKind(dto.mimeType);
    const maxSize =
      kind === AttachmentKind.AUDIO ? 15 * 1024 * 1024 : 25 * 1024 * 1024;
    if (dto.size > maxSize) {
      return `File is too large. Max size is ${Math.floor(maxSize / 1024 / 1024)}MB`;
    }

    if (kind === AttachmentKind.AUDIO && !dto.durationMs) {
      return 'durationMs is required for audio attachments';
    }

    return null;
  }

  async createUploadUrl(dto: CreateUploadUrlDto, userId: string) {
    try {
      const validationError = this.validateUpload(dto);
      if (validationError) {
        return failAction(null, false, validationError);
      }

      const config = this.getR2Config();
      const kind = this.inferKind(dto.mimeType);
      const key = `attachments/${userId}/${randomUUID()}-${dto.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const publicUrl = config.publicBaseUrl
        ? `${config.publicBaseUrl.replace(/\/$/, '')}/${key}`
        : null;

      const attachment = await this.prisma.attachment.create({
        data: {
          key,
          url: publicUrl,
          fileName: dto.fileName,
          mimeType: dto.mimeType,
          size: dto.size,
          kind,
          durationMs: dto.durationMs,
          uploadedById: userId,
        },
      });

      const command = new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        ContentType: dto.mimeType,
        ContentLength: dto.size,
      });
      const uploadUrl = await getSignedUrl(this.getClient(), command, {
        expiresIn: this.uploadTtlSeconds,
      });

      return successAction(
        {
          attachmentId: attachment.id,
          key,
          uploadUrl,
          method: 'PUT',
          headers: {
            'Content-Type': dto.mimeType,
          },
          expiresIn: this.uploadTtlSeconds,
          publicUrl,
        },
        true,
        'Upload URL created',
      );
    } catch (e) {
      console.error(e);
      return failAction(null, false, `Error during action: ${e}`);
    }
  }
}
