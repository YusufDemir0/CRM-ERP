export interface IStorageService {
    upload(params: UploadParams): Promise<UploadResult>;
    download(key: string): Promise<Buffer>;
    delete(key: string): Promise<void>;
    getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
export interface UploadParams {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    directory: string;
}
export interface UploadResult {
    key: string;
    url: string;
    size: number;
}
export declare const STORAGE_SERVICE = "STORAGE_SERVICE";
