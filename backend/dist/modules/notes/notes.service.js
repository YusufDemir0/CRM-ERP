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
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const note_entity_1 = require("./entities/note.entity");
let NotesService = class NotesService {
    constructor(noteRepository) {
        this.noteRepository = noteRepository;
    }
    async findAllByUser(userId, currentUser) {
        const hasViewAllErrors = currentUser?.isSystemAdmin ||
            currentUser?.permissions?.includes('SALES_VIEW_ALL') ||
            currentUser?.permissions?.includes('sales_view_all') ||
            currentUser?.permissions?.includes('SALES_MASTER_VIEW') ||
            currentUser?.permissions?.includes('sales_master_view');
        const qb = this.noteRepository.createQueryBuilder('note')
            .where('note.state = :state', { state: 1 });
        if (hasViewAllErrors) {
            qb.andWhere('(note.userId = :userId OR note.title LIKE :errorPrefix)', {
                userId,
                errorPrefix: 'SATIŞ HATASI BİLDİRİMİ%'
            });
        }
        else {
            qb.andWhere('note.userId = :userId', { userId });
        }
        return qb.orderBy('note.isPinned', 'DESC')
            .addOrderBy('note.createdAt', 'DESC')
            .getMany();
    }
    async create(userId, data) {
        const note = this.noteRepository.create({ ...data, userId });
        return this.noteRepository.save(note);
    }
    async update(id, userId, data, currentUser) {
        const note = await this.noteRepository.findOne({ where: { id, state: 1 } });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        const hasMasterAccess = currentUser?.isSystemAdmin ||
            currentUser?.permissions?.includes('SALES_VIEW_ALL') ||
            currentUser?.permissions?.includes('sales_view_all') ||
            currentUser?.permissions?.includes('SALES_MASTER_VIEW') ||
            currentUser?.permissions?.includes('sales_master_view');
        const isErrorReport = note.title?.startsWith('SATIŞ HATASI BİLDİRİMİ');
        const isOwner = String(note.userId) === String(userId);
        if (!isOwner && !(isErrorReport && hasMasterAccess)) {
            throw new common_1.ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
        }
        if (data.title !== undefined)
            note.title = data.title;
        if (data.content !== undefined)
            note.content = data.content;
        if (data.color !== undefined)
            note.color = data.color;
        if (data.isPinned !== undefined)
            note.isPinned = data.isPinned;
        if (data.state !== undefined)
            note.state = data.state;
        if (data.status !== undefined)
            note.status = data.status;
        return this.noteRepository.save(note);
    }
    async remove(id, userId, currentUser) {
        const note = await this.noteRepository.findOne({ where: { id, state: 1 } });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
        }
        const hasMasterAccess = currentUser?.isSystemAdmin ||
            currentUser?.permissions?.includes('SALES_VIEW_ALL') ||
            currentUser?.permissions?.includes('sales_view_all') ||
            currentUser?.permissions?.includes('SALES_MASTER_VIEW') ||
            currentUser?.permissions?.includes('sales_master_view');
        const isErrorReport = note.title?.startsWith('SATIŞ HATASI BİLDİRİMİ');
        const isOwner = String(note.userId) === String(userId);
        if (!isOwner && !(isErrorReport && hasMasterAccess)) {
            throw new common_1.ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
        }
        note.state = 0;
        await this.noteRepository.save(note);
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(note_entity_1.UserNote)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotesService);
//# sourceMappingURL=notes.service.js.map