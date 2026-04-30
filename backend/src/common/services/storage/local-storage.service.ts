import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService, UploadParams, UploadResult } from './storage.interface';
import { join, dirname } from 'path';
import { access, mkdir, writeFile, readFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';

/**
 * LocalStorageService — Async file system storage for development.
 * 
 * All I/O operations use fs/promises to avoid blocking the Node.js Event Loop.
 * Stores files in ./uploads/{directory}/{uuid}.{ext}
 * NOT suitable for production or multi-instance deployments.
 */
@Injectable()
export class LocalStorageService implements IStorageService, OnModuleInit {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get<string>('storage.local.uploadDir') || './uploads';
  }

  /**
   * Ensure the root upload directory exists on startup.
   * Uses async lifecycle hook instead of sync constructor I/O.
   */
  async onModuleInit(): Promise<void> {
    try {
      await access(this.uploadDir);
    } catch {
      await mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory created: ${this.uploadDir}`);
    }
  }

  async upload(params: UploadParams): Promise<UploadResult> {
    const { buffer, originalName, directory } = params;
    const ext = originalName.split('.').pop() || '';
    const key = `${directory}/${randomUUID()}.${ext}`;
    const fullPath = join(this.uploadDir, key);

    // Ensure subdirectory exists (async)
    const dir = dirname(fullPath);
    try {
      await access(dir);
    } catch {
      await mkdir(dir, { recursive: true });
    }

    await writeFile(fullPath, buffer);
    this.logger.debug(`File uploaded: ${key} (${buffer.length} bytes)`);

    return {
      key,
      url: `/uploads/${key}`,
      size: buffer.length,
    };
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = join(this.uploadDir, key);
    try {
      await access(fullPath);
    } catch {
      throw new Error(`File not found: ${key}`);
    }
    return readFile(fullPath);
  }

  async delete(key: string): Promise<void> {
    const fullPath = join(this.uploadDir, key);
    try {
      await unlink(fullPath);
      this.logger.debug(`File deleted: ${key}`);
    } catch (err: unknown) {
      if (err instanceof Error && (err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
      // File already gone — silently ignore
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    // Local storage doesn't support signed URLs — return direct path
    return `/uploads/${key}`;
  }
}
