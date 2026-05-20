export declare class CreateUserDto {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone?: string;
    departmentId: string;
    roleIds?: number[];
}
export declare class UpdateUserDto {
    username?: string;
    fullName?: string;
    password?: string;
    email?: string;
    phone?: string;
    departmentId: string;
    roleIds?: number[];
    state?: number;
}
