import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService, UploadParams, UploadResult } from './storage.interface';
import { randomUUID } from 'crypto';

/**
 * S3StorageService — AWS S3 / MinIO storage for production.
 * 
 * Requirements:
 *   - npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 * 
 * Works with:
 *   - AWS S3
 *   - MinIO (set S3_ENDPOINT env variable)
 *   - Anny S3-compatible storage
 */
import type { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class S3StorageService implements IStorageService {
  private readonly logger = new Logger(S3StorageService.name);
  private s3Client: S3Client; // Lazy-loaded to avoid hard dependency
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('storage.s3.bucket') || '';
    this.region = this.config.get<string>('storage.s3.region') || 'eu-central-1';

    this.initClient();
  }

  private async initClient() {
    try {
      // Dynamic import to avoid forcing @aws-sdk dependency if using local storage
      const { S3Client } = await import('@aws-sdk/client-s3');

      const endpoint = this.config.get<string>('storage.s3.endpoint');
      const forcePathStyle = this.config.get<boolean>('storage.s3.forcePathStyle');

      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: this.config.get<string>('storage.s3.accessKeyId') || '',
          secretAccessKey: this.config.get<string>('storage.s3.secretAccessKey') || '',
        },
        ...(endpoint && { endpoint }),
        ...(forcePathStyle && { forcePathStyle: true }),
      });

      this.logger.log(`S3 client initialized (bucket: ${this.bucket}, region: ${this.region})`);
    } catch (error) {
      this.logger.error('Failed to initialize S3 client. Install @aws-sdk/client-s3');
    }
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const { buffer, originalName, mimeType, directory } = params;
    const ext = originalName.split('.').pop() || '';
    const key = `${directory}/${randomUUID()}.${ext}`;

    const { PutObjectCommand } = await import('@aws-sdk/client-s3');

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    this.logger.debug(`S3 upload: ${key} (${buffer.length} bytes)`);

    return {
      key,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      size: buffer.length,
    };
  }

  async download(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');

    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    // Convert readable stream to buffer
    const chunks: Uint8Array[] = [];
    if (!response.Body) throw new Error('Empty response from S3');
    const body = response.Body as unknown as AsyncIterable<Uint8Array>;
    for await (const chunk of body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    this.logger.debug(`S3 delete: ${key}`);
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

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
