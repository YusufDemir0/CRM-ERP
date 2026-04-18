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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionContextService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_cls_1 = require("nestjs-cls");
const typeorm_1 = require("typeorm");
let TransactionContextService = class TransactionContextService {
    constructor(cls, dataSource) {
        this.cls = cls;
        this.dataSource = dataSource;
    }
    get manager() {
        return this.cls.get('TRANSACTION_MANAGER') || this.dataSource.manager;
    }
    getAvailableManager() {
        return this.cls.get('TRANSACTION_MANAGER') || null;
    }
    setManager(manager) {
        this.cls.set('TRANSACTION_MANAGER', manager);
    }
    clear() {
        this.cls.set('TRANSACTION_MANAGER', null);
    }
};
exports.TransactionContextService = TransactionContextService;
exports.TransactionContextService = TransactionContextService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_cls_1.ClsService,
        typeorm_1.DataSource])
], TransactionContextService);
//# sourceMappingURL=transaction-context.service.js.map