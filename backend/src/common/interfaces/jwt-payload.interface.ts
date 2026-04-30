export interface JwtPayload {
  sub: number;
  username: string;
  departmentId: number | null;
  tokenVersion: number;
}
