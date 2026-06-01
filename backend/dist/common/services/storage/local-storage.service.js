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
var LocalStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const crypto_1 = require("crypto");
let LocalStorageService = LocalStorageService_1 = class LocalStorageService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(LocalStorageService_1.name);
        this.uploadDir = this.config.get('storage.local.uploadDir') || './uploads';
    }
    async onModuleInit() {
        try {
            await (0, promises_1.access)(this.uploadDir);
        }
        catch {
            await (0, promises_1.mkdir)(this.uploadDir, { recursive: true });
            this.logger.log(`Upload directory created: ${this.uploadDir}`);
        }
    }
    async upload(params) {
        const { buffer, originalName, directory } = params;
        const ext = originalName.split('.').pop() || '';
        const key = `${directory}/${(0, crypto_1.randomUUID)()}.${ext}`;
        const fullPath = (0, path_1.join)(this.uploadDir, key);
        const dir = (0, path_1.dirname)(fullPath);
        try {
            await (0, promises_1.access)(dir);
        }
        catch {
            await (0, promises_1.mkdir)(dir, { recursive: true });
        }
        await (0, promises_1.writeFile)(fullPath, buffer);
        this.logger.debug(`File uploaded: ${key} (${buffer.length} bytes)`);
        return {
            key,
            url: `/uploads/${key}`,
            size: buffer.length,
        };
    }
    async download(key) {
        const fullPath = (0, path_1.join)(this.uploadDir, key);
        try {
            await (0, promises_1.access)(fullPath);
        }
        catch {
            throw new Error(`File not found: ${key}`);
        }
        return (0, promises_1.readFile)(fullPath);
    }
    async delete(key) {
        const fullPath = (0, path_1.join)(this.uploadDir, key);
        try {
            await (0, promises_1.unlink)(fullPath);
            this.logger.debug(`File deleted: ${key}`);
        }
        catch (err) {
            if (err instanceof Error && err.code !== 'ENOENT')
                throw err;
        }
    }
    async getSignedUrl(key) {
        return `/uploads/${key}`;
    }
};
exports.LocalStorageService = LocalStorageService;
exports.LocalStorageService = LocalStorageService = LocalStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LocalStorageService);
//# sourceMappingURL=local-storage.service.js.map