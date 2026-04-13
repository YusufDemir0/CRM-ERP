"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtils = void 0;
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);
const DEFAULT_TIMEZONE = 'Europe/Istanbul';
exports.DateUtils = {
    getToday: () => dayjs().tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD'),
    formatDate: (date) => dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD'),
    getNow: () => dayjs().tz(DEFAULT_TIMEZONE).toDate(),
};
//# sourceMappingURL=date.utils.js.map