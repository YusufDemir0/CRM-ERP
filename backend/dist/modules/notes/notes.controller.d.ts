import { NotesService } from './notes.service';
export declare class NotesController {
    private readonly notesService;
    constructor(notesService: NotesService);
    findAll(req: any): Promise<import("./entities/note.entity").UserNote[]>;
    create(req: any, data: any): Promise<import("./entities/note.entity").UserNote>;
    update(req: any, id: string, data: any): Promise<import("./entities/note.entity").UserNote>;
    remove(req: any, id: string): Promise<void>;
}
