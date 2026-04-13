export declare class CreateUserDto {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone?: string;
    departmentId?: number;
}
export declare class UpdateUserDto {
    username?: string;
    fullName?: string;
    password?: string;
    email?: string;
    phone?: string;
    departmentId?: number;
    state?: number;
}
