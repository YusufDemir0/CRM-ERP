declare const _default: (() => {
    type: "mysql";
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    entities: string[];
    synchronize: boolean;
    logging: string[];
    charset: string;
    timezone: string;
    extra: {
        connectionLimit: number;
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
    logging: string[];
    charset: string;
    timezone: string;
    extra: {
        connectionLimit: number;
    };
}>;
export default _default;
