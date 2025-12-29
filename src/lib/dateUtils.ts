import { format, startOfMonth, startOfWeek, endOfWeek, endOfMonth } from 'date-fns';

/**
 * Parse a date string from the database as local time.
 * This prevents the "one day earlier" bug caused by UTC interpretation
 * when JavaScript parses date-only strings (YYYY-MM-DD) as midnight UTC.
 * 
 * @param dateStr - A date string in YYYY-MM-DD format or ISO format
 * @returns Date object in local timezone
 */
export const parseDateString = (dateStr: string): Date => {
  // If it's just a date (YYYY-MM-DD), append time to force local interpretation
  if (dateStr.length === 10) {
    return new Date(dateStr + 'T00:00:00');
  }
  // For ISO strings with time, parse directly
  return new Date(dateStr);
};

/**
 * Format a date for database storage (YYYY-MM-DD format)
 * @param date - Date object to format
 * @returns String in YYYY-MM-DD format
 */
export const formatDateForDB = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Get today's date as a string in local timezone
 * @returns String in YYYY-MM-DD format
 */
export const getTodayString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Get the start of the current month as a date string
 * @returns String in YYYY-MM-DD format
 */
export const getMonthStartString = (): string => {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
};

/**
 * Get the end of the current month as a date string
 * @returns String in YYYY-MM-DD format
 */
export const getMonthEndString = (): string => {
  return format(endOfMonth(new Date()), 'yyyy-MM-dd');
};

/**
 * Get the start of the current week (Monday) as a date string
 * @returns String in YYYY-MM-DD format
 */
export const getWeekStartString = (): string => {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
};

/**
 * Get the end of the current week (Sunday) as a date string
 * @returns String in YYYY-MM-DD format
 */
export const getWeekEndString = (): string => {
  return format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
};

/**
 * Check if a date string falls within the current month
 * @param dateStr - Date string to check
 * @returns boolean
 */
export const isCurrentMonth = (dateStr: string): boolean => {
  const date = parseDateString(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

/**
 * Check if a date string falls within a specific month/year
 * @param dateStr - Date string to check
 * @param month - Month (0-11)
 * @param year - Year
 * @returns boolean
 */
export const isInMonth = (dateStr: string, month: number, year: number): boolean => {
  const date = parseDateString(dateStr);
  return date.getMonth() === month && date.getFullYear() === year;
};
