declare const _default: (() => {
    url: string;
    queues: {
        outbox: {
            name: string;
            durable: boolean;
        };
        deadLetter: {
            name: string;
            durable: boolean;
        };
    };
    exchange: {
        name: string;
        type: "topic";
        durable: boolean;
    };
    prefetchCount: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    url: string;
    queues: {
        outbox: {
            name: string;
            durable: boolean;
        };
        deadLetter: {
            name: string;
            durable: boolean;
        };
    };
    exchange: {
        name: string;
        type: "topic";
        durable: boolean;
    };
    prefetchCount: number;
}>;
export default _default;
