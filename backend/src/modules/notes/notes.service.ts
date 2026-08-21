import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNote } from './entities/note.entity';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(UserNote)
    private readonly noteRepository: Repository<UserNote>,
  ) {}

  async findAllByUser(userId: string, currentUser?: JwtPayload): Promise<UserNote[]> {
    const hasViewAllErrors =
      currentUser?.isSystemAdmin ||
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
    } else {
      qb.andWhere('note.userId = :userId', { userId });
    }

    return qb.orderBy('note.isPinned', 'DESC')
      .addOrderBy('note.createdAt', 'DESC')
      .getMany();
  }

  async create(userId: string, data: Partial<UserNote>): Promise<UserNote> {
    const note = this.noteRepository.create({ ...data, userId });
    return this.noteRepository.save(note);
  }

  async update(id: string, userId: string, data: Partial<UserNote>, currentUser?: JwtPayload): Promise<UserNote> {
    const note = await this.noteRepository.findOne({ where: { id, state: 1 } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const hasMasterAccess =
      currentUser?.isSystemAdmin ||
      currentUser?.permissions?.includes('SALES_VIEW_ALL') ||
      currentUser?.permissions?.includes('sales_view_all') ||
      currentUser?.permissions?.includes('SALES_MASTER_VIEW') ||
      currentUser?.permissions?.includes('sales_master_view');
    const isErrorReport = note.title?.startsWith('SATIŞ HATASI BİLDİRİMİ');
    const isOwner = String(note.userId) === String(userId);

    if (!isOwner && !(isErrorReport && hasMasterAccess)) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }

    if (data.title !== undefined) note.title = data.title;
    if (data.content !== undefined) note.content = data.content;
    if (data.color !== undefined) note.color = data.color;
    if (data.isPinned !== undefined) note.isPinned = data.isPinned;
    if (data.state !== undefined) note.state = data.state;
    if (data.status !== undefined) note.status = data.status;

    return this.noteRepository.save(note);
  }

  async remove(id: string, userId: string, currentUser?: JwtPayload): Promise<void> {
    const note = await this.noteRepository.findOne({ where: { id, state: 1 } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    const hasMasterAccess =
      currentUser?.isSystemAdmin ||
      currentUser?.permissions?.includes('SALES_VIEW_ALL') ||
      currentUser?.permissions?.includes('sales_view_all') ||
      currentUser?.permissions?.includes('SALES_MASTER_VIEW') ||
      currentUser?.permissions?.includes('sales_master_view');
    const isErrorReport = note.title?.startsWith('SATIŞ HATASI BİLDİRİMİ');
    const isOwner = String(note.userId) === String(userId);

    if (!isOwner && !(isErrorReport && hasMasterAccess)) {
      throw new ForbiddenException('Bu işlem için yetkiniz bulunmamaktadır.');
    }

    note.state = 0; // Soft delete
    await this.noteRepository.save(note);
  }
}
