import { User } from '../../auth/entities/user.entity';
export declare class UserNote {
    id: number;
    userId: number;
    title: string;
    content: string;
    color: string;
    isPinned: boolean;
    state: number;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
