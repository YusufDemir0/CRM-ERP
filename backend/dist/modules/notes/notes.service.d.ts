import { Repository } from 'typeorm';
import { UserNote } from './entities/note.entity';
export declare class NotesService {
    private readonly noteRepository;
    constructor(noteRepository: Repository<UserNote>);
    findAllByUser(userId: string): Promise<UserNote[]>;
    create(userId: string, data: Partial<UserNote>): Promise<UserNote>;
    update(id: string, userId: string, data: Partial<UserNote>): Promise<UserNote>;
    remove(id: string, userId: string): Promise<void>;
}
