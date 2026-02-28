import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private bucket: string;
  private endpoint: string;
  private port: number;
  private useSSL: boolean;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'localhost',
    );
    this.port = parseInt(
      this.configService.get<string>('MINIO_PORT', '9001'),
      10,
    );
    this.useSSL =
      this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    this.bucket = this.configService.get<string>('MINIO_BUCKET', 'chat-app');

    this.minioClient = new Minio.Client({
      endPoint: this.endpoint,
      port: this.port,
      useSSL: this.useSSL,
      accessKey: this.configService.get<string>(
        'MINIO_ACCESS_KEY',
        'minioadmin',
      ),
      secretKey: this.configService.get<string>(
        'MINIO_SECRET_KEY',
        'minioadmin',
      ),
    });
  }

  async onModuleInit() {
    const exists = await this.minioClient.bucketExists(this.bucket);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucket);
    }

    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${this.bucket}/*`,
        },
      ],
    });

    await this.minioClient.setBucketPolicy(this.bucket, policy);
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const ext = path.extname(file.originalname);
    const objectName = `${folder}/${uuidv4()}${ext}`;

    await this.minioClient.putObject(
      this.bucket,
      objectName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );

    const protocol = this.useSSL ? 'https' : 'http';
    return `${protocol}://${this.endpoint}:${this.port}/${this.bucket}/${objectName}`;
  }

  async deleteFile(objectName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucket, objectName);
  }
}
