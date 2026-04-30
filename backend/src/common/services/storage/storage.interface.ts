/**
 * IStorageService — Storage abstraction interface.
 * 
 * Implementations:
 *   - LocalStorageService (development)
 *   - S3StorageService (production / MinIO)
 */
export interface IStorageService {
  /**
   * Upload a file to storage.
   * @returns The storage key/path of the uploaded file.
   */
  upload(params: UploadParams): Promise<UploadResult>;

  /**
   * Download a file from storage.
   * @returns The file buffer.
   */
  download(key: string): Promise<Buffer>;

  /**
   * Delete a file from storage.
   */
  delete(key: string): Promise<void>;

  /**
   * Generate a pre-signed URL for direct browser access.
   * @param expiresInSeconds - URL expiry time (default: 3600)
   */
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

export interface UploadParams {
  /** The file buffer or stream */
  buffer: Buffer;
  /** Original filename */
  originalName: string;
  /** MIME type (e.g., 'image/jpeg') */
  mimeType: string;
  /** Storage directory/prefix (e.g., 'items', 'invoices') */
  directory: string;
}

export interface UploadResult {
  /** The storage key (used for download/delete) */
  key: string;
  /** Public or signed URL to access the file */
  url: string;
  /** File size in bytes */
  size: number;
}

/** DI Token for StorageService */
export const STORAGE_SERVICE = 'STORAGE_SERVICE';
