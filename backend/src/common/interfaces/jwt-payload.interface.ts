export interface JwtPayload {
  sub: number;
  username: string;
  fullName?: string;
  departmentId: string | null;
  tokenVersion: number;
  isSystemAdmin?: boolean;
  permissions?: string[];
  role?: string;
}
