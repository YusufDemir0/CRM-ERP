import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
export interface JwtPayload {
    sub: number;
    username: string;
    departmentId: number | null;
    tokenVersion: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithoutRequest] | [opt: import("passport-jwt").StrategyOptionsWithRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private dataSource;
    private cacheManager;
    constructor(configService: ConfigService, dataSource: DataSource, cacheManager: Cache);
    validate(payload: JwtPayload): Promise<{
        id: number;
        sub: number;
        username: string;
        departmentId: number | null;
    }>;
}
export {};
