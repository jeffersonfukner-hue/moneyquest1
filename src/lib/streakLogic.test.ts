import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateStreak } from './gameLogic';
import * as dateUtils from './dateUtils';

describe('calculateStreak', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when lastActiveDate is null', () => {
    it('should return newStreak of 1 and isNewDay true', () => {
      vi.spyOn(dateUtils, 'getTodayString').mockReturnValue('2024-01-15');
      
      const result = calculateStreak(null, 0);
      
      expect(result.newStreak).toBe(1);
      expect(result.isNewDay).toBe(true);
    });
  });

  describe('when same day (diffDays === 0)', () => {
    it('should return newStreak of -1 and isNewDay false', () => {
      vi.spyOn(dateUtils, 'getTodayString').mockReturnValue('2024-01-15');
      vi.spyOn(dateUtils, 'parseDateString').mockImplementation((date: string) => {
        return new Date(date + 'T12:00:00');
      });
      
      const result = calculateStreak('2024-01-15', 5);
      
      expect(result.newStreak).toBe(-1);
      expect(result.isNewDay).toBe(false);
    });
  });

  describe('when consecutive day (diffDays === 1)', () => {
    it('should increment streak by 1', () => {
      vi.spyOn(dateUtils, 'getTodayString').mockReturnValue('2024-01-15');
      vi.spyOn(dateUtils, 'parseDateString').mockImplementation((date: string) => {
        return new Date(date + 'T12:00:00');
      });
      
      const result = calculateStreak('2024-01-14', 5);
      
      expect(result.newStreak).toBe(6);
      expect(result.isNewDay).toBe(true);
    });

    it('should work with streak of 0', () => {
      vi.spyOn(dateUtils, 'getTodayString').mockReturnValue('2024-01-15');
      vi.spyOn(dateUtils, 'parseDateString').mockImplementation((date: string) => {
        return new Date(date + 'T12:00:00');
      });
      
      const result = calculateStreak('2024-01-14', 0);
      
      expect(result.newStreak).toBe(1);
      expect(result.isNewDay).toBe(true);
    });

    it('should work with high streaks', () => {
      vi.spyOn(dateUtils, 'getTodayString').mockReturnValue('2024-01-15');
      vi.spyOn(dateUtils, 'parseDateString').mockImplementation((date: string) => {
        return new Date(date + 'T12:00:00');
      });
      
      const result = calculateStreak('2024-01-14', 100);
      
      expect(result.newStreak).toBe(101);
      expect(result.isNewDay).toBe(true);
    });
  });

  describe('when streak is broken (diffDays > 1)', () => {
    it('should reset streak to 1 when missing 1 day', () => {
      vi.spyOn(dateUtils, 'getTodayString').mockReturnValue('2024-01-15');
      vi.spyOn(dateUtils, 'parseDateString').mockImplementation((date: string) => {
        return new Date(date + 'T12:00:00');
      });
      
      const result = calculateStreak('2024-01-13', 10);
      
      expect(result.newStreak).toBe(1);
      expect(result.isNewDay).toBe(true);
    });

    it('should reset streak to 1 when missing many days', () => {
      vi.spyOn(dateUtils, 'getTodayString').mockReturnValue('2024-01-15');
      vi.spyOn(dateUtils, 'parseDateString').mockImplementation((date: string) => {
        return new Date(date + 'T12:00:00');
      });
      
      const result = calculateStreak('2024-01-01', 50);
      
      expect(result.newStreak).toBe(1);
      expect(result.isNewDay).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle month boundaries correctly', () => {
      vi.spyOn(dateUtils, 'getTodayString').mockReturnValue('2024-02-01');
      vi.spyOn(dateUtils, 'parseDateString').mockImplementation((date: string) => {
        return new Date(date + 'T12:00:00');
      });
      
      const result = calculateStreak('2024-01-31', 7);
      
      expect(result.newStreak).toBe(8);
      expect(result.isNewDay).toBe(true);
    });

    it('should handle year boundaries correctly', () => {
      vi.spyOn(dateUtils, 'getTodayString').mockReturnValue('2025-01-01');
      vi.spyOn(dateUtils, 'parseDateString').mockImplementation((date: string) => {
        return new Date(date + 'T12:00:00');
      });
      
      const result = calculateStreak('2024-12-31', 365);
      
      expect(result.newStreak).toBe(366);
      expect(result.isNewDay).toBe(true);
    });

    it('should handle default currentStreak parameter', () => {
      vi.spyOn(dateUtils, 'getTodayString').mockReturnValue('2024-01-15');
      vi.spyOn(dateUtils, 'parseDateString').mockImplementation((date: string) => {
        return new Date(date + 'T12:00:00');
      });
      
      // Call without second parameter
      const result = calculateStreak('2024-01-14');
      
      expect(result.newStreak).toBe(1); // 0 + 1
      expect(result.isNewDay).toBe(true);
    });
  });
});
