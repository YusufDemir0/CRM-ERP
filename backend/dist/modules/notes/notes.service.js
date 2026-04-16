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
    async findAllByUser(userId) {
        return this.noteRepository.find({
            where: { userId, state: 1 },
            order: { isPinned: 'DESC', createdAt: 'DESC' },
        });
    }
    async create(userId, data) {
        const note = this.noteRepository.create({ ...data, userId });
        return this.noteRepository.save(note);
    }
    async update(id, userId, data) {
        const note = await this.noteRepository.findOne({ where: { id, userId, state: 1 } });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
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
        return this.noteRepository.save(note);
    }
    async remove(id, userId) {
        const note = await this.noteRepository.findOne({ where: { id, userId, state: 1 } });
        if (!note) {
            throw new common_1.NotFoundException('Note not found');
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