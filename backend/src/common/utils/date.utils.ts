const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Europe/Istanbul';

export const DateUtils = {
  getToday: () => dayjs().tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD'),
  formatDate: (date: Date | string) => dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD'),
  getNow: () => dayjs().tz(DEFAULT_TIMEZONE).toDate(),
};
