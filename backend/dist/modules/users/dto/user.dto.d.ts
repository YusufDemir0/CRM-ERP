export declare class CreateUserDto {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone?: string;
    departmentId?: number;
}
export declare class UpdateUserDto {
    fullName?: string;
    password?: string;
    email?: string;
    phone?: string;
    departmentId?: number;
    state?: number;
}
