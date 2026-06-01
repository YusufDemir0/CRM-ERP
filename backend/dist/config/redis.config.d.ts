declare const _default: (() => {
    host: string;
    port: number;
    password: string | undefined;
    keyPrefix: string;
    ttl: number;
    retryDelayMs: number;
    maxRetries: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string | undefined;
    keyPrefix: string;
    ttl: number;
    retryDelayMs: number;
    maxRetries: number;
}>;
export default _default;
