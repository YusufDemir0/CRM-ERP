declare const _default: (() => {
    provider: "local" | "s3";
    local: {
        uploadDir: string;
    };
    s3: {
        bucket: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        endpoint: string | undefined;
        forcePathStyle: boolean;
    };
    maxFileSizeMb: number;
    allowedMimeTypes: string[];
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    provider: "local" | "s3";
    local: {
        uploadDir: string;
    };
    s3: {
        bucket: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        endpoint: string | undefined;
        forcePathStyle: boolean;
    };
    maxFileSizeMb: number;
    allowedMimeTypes: string[];
}>;
export default _default;
