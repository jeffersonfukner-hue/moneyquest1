import { useMemo, useCallback } from 'react';
import { useMonthlyClosures } from '@/hooks/useMonthlyClosures';

/**
 * Hook to check if a transaction date falls within a closed month
 * and provide protection status for editing
 */
export const useClosedMonthProtection = () => {
  const { closures, isMonthClosed } = useMonthlyClosures();

  /**
   * Check if a specific date is in a closed month
   */
  const isDateInClosedMonth = useCallback((dateString: string): boolean => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-indexed
    
    return isMonthClosed(year, month);
  }, [isMonthClosed]);

  /**
   * Check if a transaction can be edited based on its date
   */
  const canEditTransaction = useCallback((transactionDate: string): boolean => {
    return !isDateInClosedMonth(transactionDate);
  }, [isDateInClosedMonth]);

  /**
   * Get all closed periods for display
   */
  const closedPeriods = useMemo(() => {
    return closures
      .filter(c => c.status === 'closed')
      .map(c => ({
        year: c.periodYear,
        month: c.periodMonth,
        label: new Date(c.periodYear, c.periodMonth - 1, 1).toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        }),
        closedAt: c.closedAt,
      }));
  }, [closures]);

  return {
    isDateInClosedMonth,
    canEditTransaction,
    closedPeriods,
  };
};
