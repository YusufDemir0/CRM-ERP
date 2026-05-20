import { NotesService } from './notes.service';
import { UserNote } from './entities/note.entity';
export declare class NotesController {
    private readonly notesService;
    constructor(notesService: NotesService);
    findAll(req: {
        user: {
            id: string;
        };
    }): Promise<UserNote[]>;
    create(req: {
        user: {
            id: string;
        };
    }, data: Partial<UserNote>): Promise<UserNote>;
    update(req: {
        user: {
            id: string;
        };
    }, id: string, data: Partial<UserNote>): Promise<UserNote>;
    remove(req: {
        user: {
            id: string;
        };
    }, id: string): Promise<void>;
}
