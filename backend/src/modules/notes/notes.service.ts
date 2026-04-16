import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserNote } from './entities/note.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(UserNote)
    private readonly noteRepository: Repository<UserNote>,
  ) {}

  async findAllByUser(userId: number): Promise<UserNote[]> {
    return this.noteRepository.find({
      where: { userId, state: 1 },
      order: { isPinned: 'DESC', createdAt: 'DESC' },
    });
  }

  async create(userId: number, data: Partial<UserNote>): Promise<UserNote> {
    const note = this.noteRepository.create({ ...data, userId });
    return this.noteRepository.save(note);
  }

  async update(id: number, userId: number, data: Partial<UserNote>): Promise<UserNote> {
    const note = await this.noteRepository.findOne({ where: { id, userId, state: 1 } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    if (data.title !== undefined) note.title = data.title;
    if (data.content !== undefined) note.content = data.content;
    if (data.color !== undefined) note.color = data.color;
    if (data.isPinned !== undefined) note.isPinned = data.isPinned;
    if (data.state !== undefined) note.state = data.state;

    return this.noteRepository.save(note);
  }

  async remove(id: number, userId: number): Promise<void> {
    const note = await this.noteRepository.findOne({ where: { id, userId, state: 1 } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    note.state = 0; // Soft delete
    await this.noteRepository.save(note);
  }
}
