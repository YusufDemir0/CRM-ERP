import { Repository } from 'typeorm';
import { UserNote } from './entities/note.entity';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
export declare class NotesService {
    private readonly noteRepository;
    constructor(noteRepository: Repository<UserNote>);
    findAllByUser(userId: string, currentUser?: JwtPayload): Promise<UserNote[]>;
    create(userId: string, data: Partial<UserNote>): Promise<UserNote>;
    update(id: string, userId: string, data: Partial<UserNote>, currentUser?: JwtPayload): Promise<UserNote>;
    remove(id: string, userId: string, currentUser?: JwtPayload): Promise<void>;
}
