import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Europe/Istanbul';

export const DateUtils = {
  // Returns relative local date (YYYY-MM-DD)
  getToday: () => dayjs().tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD'),
  
  // UTC Range Helpers for accurate SQL Between queries
  getStartOfDay: (date?: string | Date) => 
    dayjs(date).tz(DEFAULT_TIMEZONE).startOf('day').utc().toDate(),
    
  getEndOfDay: (date?: string | Date) => 
    dayjs(date).tz(DEFAULT_TIMEZONE).endOf('day').utc().toDate(),

  // Formats any date to local timezone
  formatDate: (date: Date | string) => dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD'),
  
  // Returns current timestamp in UTC
  getNow: () => dayjs.utc().toDate(),
  
  // Parsers
  toUtc: (date: string) => dayjs.tz(date, DEFAULT_TIMEZONE).utc().toDate(),
  toLocal: (date: Date | string) => dayjs(date).tz(DEFAULT_TIMEZONE),
};
