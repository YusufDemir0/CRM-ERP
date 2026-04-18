export declare class LoginDto {
    username: string;
    password: string;
}
export declare class RegisterDto {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone?: string;
    departmentId?: number;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
