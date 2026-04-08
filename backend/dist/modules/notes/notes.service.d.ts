import { Repository } from 'typeorm';
import { UserNote } from './entities/note.entity';
export declare class NotesService {
    private readonly noteRepository;
    constructor(noteRepository: Repository<UserNote>);
    findAllByUser(userId: number): Promise<UserNote[]>;
    create(userId: number, data: Partial<UserNote>): Promise<UserNote>;
    update(id: number, userId: number, data: Partial<UserNote>): Promise<UserNote>;
    remove(id: number, userId: number): Promise<void>;
}
