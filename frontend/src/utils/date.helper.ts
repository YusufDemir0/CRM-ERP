import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Europe/Istanbul';

export const getTodayString = () => {
  return dayjs().tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Returns a date string in YYYY-MM-DD format correctly handling local timezone.
 * Standardized replacement for the old getLocalDateString.
 */
export const getLocalDateString = (date?: Date | string): string => {
  if (!date) return getTodayString();
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Formats a date string or object to local Turkish format (DD.MM.YYYY)
 */
export const formatDisplayDate = (date: string | Date | null) => {
  if (!date) return '-';
  return dayjs(date).format('DD.MM.YYYY');
};

/**
 * Legacy support for formatTurkishDate
 */
export const formatTurkishDate = formatDisplayDate;

export const formatDisplayDateTime = (date: string | Date | null) => {
  if (!date) return '-';
  return dayjs(date).format('DD.MM.YYYY HH:mm');
};

export default dayjs;
