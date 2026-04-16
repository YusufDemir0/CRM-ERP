import dayjs from 'dayjs';
export declare const DateUtils: {
    getToday: () => string;
    getStartOfDay: (date?: string | Date) => Date;
    getEndOfDay: (date?: string | Date) => Date;
    formatDate: (date: Date | string) => string;
    getNow: () => Date;
    toUtc: (date: string) => Date;
    toLocal: (date: Date | string) => dayjs.Dayjs;
};
