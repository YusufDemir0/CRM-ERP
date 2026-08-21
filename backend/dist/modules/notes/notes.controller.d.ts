import { NotesService } from './notes.service';
import { UserNote } from './entities/note.entity';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
export declare class NotesController {
    private readonly notesService;
    constructor(notesService: NotesService);
    findAll(user: JwtPayload): Promise<UserNote[]>;
    create(user: JwtPayload, data: Partial<UserNote>): Promise<UserNote>;
    update(user: JwtPayload, id: string, data: Partial<UserNote>): Promise<UserNote>;
    remove(user: JwtPayload, id: string): Promise<void>;
}
