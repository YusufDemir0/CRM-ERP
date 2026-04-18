import { NotesService } from './notes.service';
import { UserNote } from './entities/note.entity';
export declare class NotesController {
    private readonly notesService;
    constructor(notesService: NotesService);
    findAll(req: {
        user: {
            id: number;
        };
    }): Promise<UserNote[]>;
    create(req: {
        user: {
            id: number;
        };
    }, data: Partial<UserNote>): Promise<UserNote>;
    update(req: {
        user: {
            id: number;
        };
    }, id: string, data: Partial<UserNote>): Promise<UserNote>;
    remove(req: {
        user: {
            id: number;
        };
    }, id: string): Promise<void>;
}
