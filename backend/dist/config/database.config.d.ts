declare const _default: (() => {
    type: "mysql";
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    entities: string[];
    synchronize: boolean;
    migrationsRun: boolean;
    migrations: string[];
    logging: string[];
    charset: string;
    timezone: string;
    extra: {
        ssl?: {
            rejectUnauthorized: boolean;
            ca: string | undefined;
        } | undefined;
        connectionLimit: number;
        connectTimeout: number;
        enableKeepAlive: boolean;
        keepAliveInitialDelay: number;
    };
} | {
    replication: {
        master: {
            host: string;
            port: number;
            username: string;
            password: string;
            database: string;
        };
        slaves: {
            host: string;
            port: number;
            username: string;
            password: string;
            database: string;
        }[];
    };
    type: "mysql";
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    entities: string[];
    synchronize: boolean;
    migrationsRun: boolean;
    migrations: string[];
    logging: string[];
    charset: string;
    timezone: string;
    extra: {
        ssl?: {
            rejectUnauthorized: boolean;
            ca: string | undefined;
        } | undefined;
        connectionLimit: number;
        connectTimeout: number;
        enableKeepAlive: boolean;
        keepAliveInitialDelay: number;
    };
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    type: "mysql";
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    entities: string[];
    synchronize: boolean;
    migrationsRun: boolean;
    migrations: string[];
    logging: string[];
    charset: string;
    timezone: string;
    extra: {
        ssl?: {
            rejectUnauthorized: boolean;
            ca: string | undefined;
        } | undefined;
        connectionLimit: number;
        connectTimeout: number;
        enableKeepAlive: boolean;
        keepAliveInitialDelay: number;
    };
} | {
    replication: {
        master: {
            host: string;
            port: number;
            username: string;
            password: string;
            database: string;
        };
        slaves: {
            host: string;
            port: number;
            username: string;
            password: string;
            database: string;
        }[];
    };
    type: "mysql";
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    entities: string[];
    synchronize: boolean;
    migrationsRun: boolean;
    migrations: string[];
    logging: string[];
    charset: string;
    timezone: string;
    extra: {
        ssl?: {
            rejectUnauthorized: boolean;
            ca: string | undefined;
        } | undefined;
        connectionLimit: number;
        connectTimeout: number;
        enableKeepAlive: boolean;
        keepAliveInitialDelay: number;
    };
}>;
export default _default;
