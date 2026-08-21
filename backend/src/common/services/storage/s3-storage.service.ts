import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService, UploadParams, UploadResult } from './storage.interface';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * S3StorageService — AWS S3 / Cloudflare R2 / MinIO storage for production.
 */
@Injectable()
export class S3StorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(S3StorageService.name);
  private s3Client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly publicDomain?: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('storage.s3.bucket') || '';
    this.region = this.config.get<string>('storage.s3.region') || 'auto';
    this.publicDomain = this.config.get<string>('storage.s3.publicDomain');
  }

  onModuleInit() {
    const endpoint = this.config.get<string>('storage.s3.endpoint');
    const forcePathStyle = this.config.get<boolean>('storage.s3.forcePathStyle') ?? false;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.config.get<string>('storage.s3.accessKeyId') || '',
        secretAccessKey: this.config.get<string>('storage.s3.secretAccessKey') || '',
      },
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle,
    });

    this.logger.log(`S3 Storage Client initialized (Bucket: ${this.bucket}, Endpoint: ${endpoint || 'AWS Default'})`);
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const { buffer, originalName, mimeType, directory } = params;
    const ext = originalName.split('.').pop() || 'bin';
    const key = `${directory}/${Date.now()}-${randomUUID()}.${ext}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    const url = this.publicDomain
      ? `${this.publicDomain.replace(/\/$/, '')}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    this.logger.debug(`S3 upload: ${key} (${buffer.length} bytes)`);

    return {
      key,
      url,
      size: buffer.length,
    };
  }

  async download(key: string): Promise<Buffer> {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    const chunks: Uint8Array[] = [];
    if (!response.Body) throw new Error('Empty response from S3');
    const body = response.Body as unknown as AsyncIterable<Uint8Array>;
    for await (const chunk of body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    this.logger.debug(`S3 delete: ${key}`);
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: expiresInSeconds },
    );
  }
}
