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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const setting_entity_1 = require("./entities/setting.entity");
let SettingsService = class SettingsService {
    constructor(settingRepo) {
        this.settingRepo = settingRepo;
    }
    async findAll() {
        return this.settingRepo.find({ order: { settingKey: 'ASC' } });
    }
    async findByKey(key) {
        const setting = await this.settingRepo.findOne({ where: { settingKey: key } });
        if (!setting)
            throw new common_1.NotFoundException(`Ayar bulunamadı: ${key}`);
        return setting;
    }
    async getValue(key) {
        const setting = await this.settingRepo.findOne({ where: { settingKey: key } });
        return setting?.settingValue ?? null;
    }
    async updateByKey(key, value) {
        let setting = await this.settingRepo.findOne({ where: { settingKey: key } });
        if (!setting) {
            setting = this.settingRepo.create({ settingKey: key, settingValue: value });
        }
        else {
            setting.settingValue = value;
        }
        return this.settingRepo.save(setting);
    }
    async bulkUpdate(items) {
        const results = [];
        for (const item of items) {
            const updated = await this.updateByKey(item.settingKey, item.settingValue);
            results.push(updated);
        }
        return results;
    }
    async getSettingsMap() {
        const all = await this.findAll();
        const map = {};
        for (const s of all) {
            map[s.settingKey] = s.settingValue || '';
        }
        return map;
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(setting_entity_1.Setting)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map