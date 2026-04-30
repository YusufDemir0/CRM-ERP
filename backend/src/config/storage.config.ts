import { registerAs } from '@nestjs/config';

/**
 * Storage Configuration — Enterprise Ready
 * 
 * Supports:
 *   - Local disk (development)
 *   - AWS S3 (production)
 *   - MinIO (self-hosted S3-compatible, on-prem)
 */
export default registerAs('storage', () => ({
  provider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 's3',

  // Local storage config (development)
  local: {
    uploadDir: process.env.STORAGE_LOCAL_DIR || './uploads',
  },

  // S3 / MinIO config (production)
  s3: {
    bucket: process.env.S3_BUCKET || '',
    region: process.env.S3_REGION || 'eu-central-1',
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
    // For MinIO: set S3_ENDPOINT to your MinIO URL
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT, // Required for MinIO
  },

  // Upload limits
  maxFileSizeMb: parseInt(process.env.STORAGE_MAX_FILE_SIZE_MB || '10', 10),
  allowedMimeTypes: [
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'application/vnd.ms-excel', // xls
  ],
}));
