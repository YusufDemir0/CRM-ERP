"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtils = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Europe/Istanbul';
exports.DateUtils = {
    getToday: () => dayjs_1.default.utc().format('YYYY-MM-DD'),
    getStartOfDay: (date) => (0, dayjs_1.default)(date).tz(APP_TIMEZONE).startOf('day').utc().toDate(),
    getEndOfDay: (date) => (0, dayjs_1.default)(date).tz(APP_TIMEZONE).endOf('day').utc().toDate(),
    getNow: () => dayjs_1.default.utc().toDate(),
    formatDate: (date) => (0, dayjs_1.default)(date).tz(APP_TIMEZONE).format('YYYY-MM-DD'),
    formatDateTime: (date) => (0, dayjs_1.default)(date).tz(APP_TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
    toUtc: (date) => dayjs_1.default.tz(date, APP_TIMEZONE).utc().toDate(),
    toLocal: (date) => (0, dayjs_1.default)(date).tz(APP_TIMEZONE),
    timezone: APP_TIMEZONE,
};
//# sourceMappingURL=date.utils.js.map