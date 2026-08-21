"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var S3StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let S3StorageService = S3StorageService_1 = class S3StorageService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(S3StorageService_1.name);
        this.bucket = this.config.get('storage.s3.bucket') || '';
        this.region = this.config.get('storage.s3.region') || 'auto';
        this.publicDomain = this.config.get('storage.s3.publicDomain');
    }
    onModuleInit() {
        const endpoint = this.config.get('storage.s3.endpoint');
        const forcePathStyle = this.config.get('storage.s3.forcePathStyle') ?? false;
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            credentials: {
                accessKeyId: this.config.get('storage.s3.accessKeyId') || '',
                secretAccessKey: this.config.get('storage.s3.secretAccessKey') || '',
            },
            ...(endpoint ? { endpoint } : {}),
            forcePathStyle,
        });
        this.logger.log(`S3 Storage Client initialized (Bucket: ${this.bucket}, Endpoint: ${endpoint || 'AWS Default'})`);
    }
    async upload(params) {
        const { buffer, originalName, mimeType, directory } = params;
        const ext = originalName.split('.').pop() || 'bin';
        const key = `${directory}/${Date.now()}-${(0, crypto_1.randomUUID)()}.${ext}`;
        await this.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }));
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
    async download(key) {
        const response = await this.s3Client.send(new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
        const chunks = [];
        if (!response.Body)
            throw new Error('Empty response from S3');
        const body = response.Body;
        for await (const chunk of body) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }
    async delete(key) {
        await this.s3Client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
        this.logger.debug(`S3 delete: ${key}`);
    }
    async getSignedUrl(key, expiresInSeconds = 3600) {
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }), { expiresIn: expiresInSeconds });
    }
};
exports.S3StorageService = S3StorageService;
exports.S3StorageService = S3StorageService = S3StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3StorageService);
//# sourceMappingURL=s3-storage.service.js.map