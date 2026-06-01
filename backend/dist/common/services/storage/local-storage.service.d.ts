import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService, UploadParams, UploadResult } from './storage.interface';
export declare class LocalStorageService implements IStorageService, OnModuleInit {
    private readonly config;
    private readonly logger;
    private readonly uploadDir;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    upload(params: UploadParams): Promise<UploadResult>;
    download(key: string): Promise<Buffer>;
    delete(key: string): Promise<void>;
    getSignedUrl(key: string): Promise<string>;
}
