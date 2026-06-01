"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('storage', () => ({
    provider: (process.env.STORAGE_PROVIDER || 'local'),
    local: {
        uploadDir: process.env.STORAGE_LOCAL_DIR || './uploads',
    },
    s3: {
        bucket: process.env.S3_BUCKET || '',
        region: process.env.S3_REGION || 'eu-central-1',
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: !!process.env.S3_ENDPOINT,
    },
    maxFileSizeMb: parseInt(process.env.STORAGE_MAX_FILE_SIZE_MB || '10', 10),
    allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ],
}));
//# sourceMappingURL=storage.config.js.map