"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const crypto = __importStar(require("crypto"));
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../auth/entities/user.entity");
const role_entity_1 = require("../auth/entities/role.entity");
const user_dto_1 = require("./dto/user.dto");
const transactional_1 = require("@nestjs-cls/transactional");
const transaction_context_service_1 = require("../../common/services/transaction-context.service");
const sql_helper_1 = require("../../common/utils/sql.helper");
let UsersService = class UsersService {
    constructor(userRepo, roleRepo, cacheManager, transactionContext) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.cacheManager = cacheManager;
        this.transactionContext = transactionContext;
    }
    async findAll(query) {
        const qb = this.userRepo.createQueryBuilder('user')
            .leftJoinAndSelect('user.department', 'department')
            .leftJoinAndSelect('user.roles', 'roles')
            .select([
            'user.id', 'user.username', 'user.fullName', 'user.email',
            'user.phone', 'user.departmentId', 'user.state', 'user.createdAt',
            'user.entryDate', 'user.lastDeactivationDate',
            'department.id', 'department.name',
            'roles.id', 'roles.name',
        ]);
        if (query.search) {
            const searchPattern = query.search.replace(/[+><()~*\"@\-]/g, ' ').trim();
            const safeLikePattern = (0, sql_helper_1.getSafeSearchPattern)(query.search);
            if (searchPattern) {
                qb.where('(MATCH(user.username, user.fullName, user.email, user.phone) AGAINST(:s IN BOOLEAN MODE) OR department.name LIKE :like OR roles.name LIKE :like)', { s: `*${searchPattern}*`, like: safeLikePattern });
            }
        }
        if (query.state !== undefined) {
            qb.andWhere('user.state = :state', { state: query.state });
        }
        const sortFieldMap = {
            'fullName': 'user.fullName',
            'username': 'user.username',
            'email': 'user.email',
            'createdAt': 'user.createdAt',
            'department.name': 'department.name',
            'roles.name': 'roles.name'
        };
        const allowedSortCols = ['fullName', 'username', 'email', 'createdAt', 'department.name', 'roles.name'];
        const sortCol = allowedSortCols.includes(query.sortBy || '') ? sortFieldMap[query.sortBy] : 'user.createdAt';
        qb.orderBy(sortCol, query.sortOrderSafe);
        qb.skip(query.skip).take(query.limit);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            meta: {
                total,
                page: query.page || 1,
                limit: query.limit || 20,
                totalPages: Math.ceil(total / (query.limit || 20)),
            },
        };
    }
    async findOne(id) {
        const user = await this.userRepo.findOne({
            where: { id: String(id) },
            relations: ['department', 'roles', 'roles.permissions'],
        });
        if (!user)
            throw new common_1.NotFoundException('Kullanıcı bulunamadı');
        return user;
    }
    async create(dto, currentUserId) {
        const manager = this.transactionContext.manager;
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(dto.password, salt);
        const today = new Date().toISOString().split('T')[0];
        const user = manager.create(user_entity_1.User, {
            username: dto.username,
            passwordHash,
            fullName: dto.fullName,
            email: dto.email,
            phone: dto.phone || null,
            departmentId: dto.departmentId || null,
            createdBy: currentUserId || null,
            entryDate: today,
        });
        if (dto.roleIds && dto.roleIds.length > 0) {
            user.roles = await manager.find(role_entity_1.Role, {
                where: { id: (0, typeorm_2.In)(dto.roleIds) }
            });
        }
        try {
            return await manager.save(user);
        }
        catch (error) {
            if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
                throw new common_1.ConflictException('Kullanıcı adı veya email zaten mevcut');
            }
            throw error;
        }
    }
    async update(id, dto, currentUserId) {
        const user = await this.findOne(id);
        if (dto.username && dto.username !== user.username) {
            const existing = await this.userRepo.findOne({ where: { username: dto.username } });
            if (existing && existing.id !== String(id))
                throw new common_1.ConflictException('Kullanıcı adı zaten mevcut');
            user.username = dto.username;
        }
        if (dto.email && dto.email !== user.email) {
            const existing = await this.userRepo.findOne({ where: { email: dto.email } });
            if (existing && existing.id !== String(id))
                throw new common_1.ConflictException('Email zaten mevcut');
            user.email = dto.email;
        }
        if (dto.password && dto.password.trim() !== '') {
            const salt = await bcrypt.genSalt(12);
            user.passwordHash = await bcrypt.hash(dto.password, salt);
            user.tokenVersion += 1;
        }
        if (dto.username !== undefined)
            user.username = dto.username;
        if (dto.fullName !== undefined)
            user.fullName = dto.fullName;
        if (dto.email !== undefined)
            user.email = dto.email;
        if (dto.phone !== undefined)
            user.phone = dto.phone;
        if (dto.departmentId !== undefined) {
            user.department = dto.departmentId ? { id: dto.departmentId } : null;
            user.departmentId = dto.departmentId || null;
        }
        if (dto.roleIds !== undefined) {
            if (dto.roleIds.length > 0) {
                user.roles = await this.roleRepo.find({
                    where: { id: (0, typeorm_2.In)(dto.roleIds) }
                });
            }
            else {
                user.roles = [];
            }
        }
        if (dto.state !== undefined && user.state !== dto.state) {
            user.state = dto.state;
            user.tokenVersion += 1;
            const today = new Date().toISOString().split('T')[0];
            if (dto.state === 0) {
                user.lastDeactivationDate = today;
            }
            else if (dto.state === 1) {
                user.lastDeactivationDate = null;
            }
        }
        user.updatedBy = currentUserId || null;
        const savedUser = await this.userRepo.save(user);
        if (dto.password || dto.state !== undefined) {
            await this.cacheManager.del(`user_state_${id}`);
        }
        return savedUser;
    }
    async softDelete(id, currentUserId) {
        const user = await this.userRepo.findOne({ where: { id: String(id) } });
        if (!user)
            throw new common_1.NotFoundException('Kullanıcı bulunamadı');
        const suffix = `_del_${crypto.randomUUID().substring(0, 8)}`;
        await this.userRepo.update(id, {
            username: `${user.username}${suffix}`.substring(0, 100),
            email: `${user.email}${suffix}`.substring(0, 150),
            state: 0,
            updatedBy: currentUserId || null,
        });
        await this.userRepo.softDelete(id);
    }
    async getStatus() {
        const [active, passive, total, adminCount] = await Promise.all([
            this.userRepo.count({ where: { state: 1 } }),
            this.userRepo.count({ where: { state: 0 } }),
            this.userRepo.count(),
            this.userRepo.createQueryBuilder('user')
                .innerJoin('user.roles', 'role')
                .where('role.name = :role', { role: 'admin' })
                .getCount(),
        ]);
        return { active, passive, total, adminCount };
    }
};
exports.UsersService = UsersService;
__decorate([
    (0, transactional_1.Transactional)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.CreateUserDto, String]),
    __metadata("design:returntype", Promise)
], UsersService.prototype, "create", null);
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository, Object, transaction_context_service_1.TransactionContextService])
], UsersService);
//# sourceMappingURL=users.service.js.map