import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Application-level timezone for display/formatting purposes.
 * All storage and transmission MUST use UTC.
 * 
 * This value is read from the APP_TIMEZONE environment variable,
 * defaulting to 'Europe/Istanbul' for backward compatibility.
 */
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Europe/Istanbul';

export const DateUtils = {
  // Returns current UTC date (YYYY-MM-DD) — used for DB storage
  getToday: () => dayjs.utc().format('YYYY-MM-DD'),
  
  // UTC Range Helpers for accurate SQL Between queries
  // Takes a local date string and converts start/end of that day to UTC
  getStartOfDay: (date?: string | Date) => 
    dayjs(date).tz(APP_TIMEZONE).startOf('day').utc().toDate(),
    
  getEndOfDay: (date?: string | Date) => 
    dayjs(date).tz(APP_TIMEZONE).endOf('day').utc().toDate(),

  // Returns current timestamp in UTC — used for DB timestamps
  getNow: () => dayjs.utc().toDate(),

  // Formats any UTC date to local timezone — used ONLY for display in API responses
  formatDate: (date: Date | string) => dayjs(date).tz(APP_TIMEZONE).format('YYYY-MM-DD'),
  formatDateTime: (date: Date | string) => dayjs(date).tz(APP_TIMEZONE).format('YYYY-MM-DD HH:mm:ss'),
  
  // Parsers — convert local input to UTC for storage
  toUtc: (date: string) => dayjs.tz(date, APP_TIMEZONE).utc().toDate(),
  
  // Convert UTC date to local dayjs instance — used ONLY for display
  toLocal: (date: Date | string) => dayjs(date).tz(APP_TIMEZONE),

  // Expose timezone for reference
  timezone: APP_TIMEZONE,
};
