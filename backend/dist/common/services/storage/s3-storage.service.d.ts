import { ConfigService } from '@nestjs/config';
import { IStorageService, UploadParams, UploadResult } from './storage.interface';
export declare class S3StorageService implements IStorageService {
    private readonly config;
    private readonly logger;
    private s3Client;
    private readonly bucket;
    private readonly region;
    constructor(config: ConfigService);
    private initClient;
    upload(params: UploadParams): Promise<UploadResult>;
    download(key: string): Promise<Buffer>;
    delete(key: string): Promise<void>;
    getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
