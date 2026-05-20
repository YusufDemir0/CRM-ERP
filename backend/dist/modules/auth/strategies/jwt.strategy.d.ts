import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Cache } from 'cache-manager';
export interface JwtPayload {
    sub: number;
    username: string;
    departmentId: string | null;
    tokenVersion: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private dataSource;
    private cacheManager;
    private readonly logger;
    constructor(configService: ConfigService, dataSource: DataSource, cacheManager: Cache);
    validate(payload: JwtPayload): Promise<{
        id: number;
        sub: number;
        username: string;
        departmentId: string | null;
        tokenVersion: number;
    }>;
}
export {};
