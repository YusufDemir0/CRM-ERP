declare const _default: (() => {
    url: string | undefined;
    host: string;
    port: number;
    password: string | undefined;
    keyPrefix: string;
    ttl: number;
    retryDelayMs: number;
    maxRetries: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    url: string | undefined;
    host: string;
    port: number;
    password: string | undefined;
    keyPrefix: string;
    ttl: number;
    retryDelayMs: number;
    maxRetries: number;
}>;
export default _default;
