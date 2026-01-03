import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateXP,
  getLevelFromXP,
  getXPProgress,
  getLevelTitleKey,
  calculateFinancialMood,
  XP_PER_LEVEL,
} from './gameLogic';

describe('gameLogic', () => {
  describe('calculateXP', () => {
    describe('INCOME transactions', () => {
      it('should return minimum 1 XP for very small amounts', () => {
        expect(calculateXP(0, 'INCOME')).toBe(1);
        expect(calculateXP(5, 'INCOME')).toBe(1);
        expect(calculateXP(9, 'INCOME')).toBe(1);
      });

      it('should calculate XP correctly for normal amounts', () => {
        expect(calculateXP(10, 'INCOME')).toBe(1);
        expect(calculateXP(50, 'INCOME')).toBe(5);
        expect(calculateXP(100, 'INCOME')).toBe(10);
        expect(calculateXP(500, 'INCOME')).toBe(50);
      });

      it('should cap XP at 100 for large income', () => {
        expect(calculateXP(1000, 'INCOME')).toBe(100);
        expect(calculateXP(5000, 'INCOME')).toBe(100);
        expect(calculateXP(10000, 'INCOME')).toBe(100);
      });

      it('should never return 0 XP', () => {
        expect(calculateXP(0, 'INCOME')).toBeGreaterThanOrEqual(1);
        expect(calculateXP(-10, 'INCOME')).toBeGreaterThanOrEqual(1);
      });
    });

    describe('EXPENSE transactions', () => {
      it('should return minimum 1 XP for very small amounts', () => {
        expect(calculateXP(0, 'EXPENSE')).toBe(1);
        expect(calculateXP(10, 'EXPENSE')).toBe(1);
        expect(calculateXP(19, 'EXPENSE')).toBe(1);
      });

      it('should calculate XP correctly for normal amounts', () => {
        expect(calculateXP(20, 'EXPENSE')).toBe(1);
        expect(calculateXP(40, 'EXPENSE')).toBe(2);
        expect(calculateXP(100, 'EXPENSE')).toBe(5);
        expect(calculateXP(200, 'EXPENSE')).toBe(10);
      });

      it('should cap XP at 50 for large expenses', () => {
        expect(calculateXP(1000, 'EXPENSE')).toBe(50);
        expect(calculateXP(5000, 'EXPENSE')).toBe(50);
        expect(calculateXP(10000, 'EXPENSE')).toBe(50);
      });

      it('should never return 0 XP', () => {
        expect(calculateXP(0, 'EXPENSE')).toBeGreaterThanOrEqual(1);
      });
    });

    describe('XP formula validation', () => {
      it('INCOME should give more XP than EXPENSE for same amount', () => {
        const amount = 100;
        const incomeXP = calculateXP(amount, 'INCOME');
        const expenseXP = calculateXP(amount, 'EXPENSE');
        expect(incomeXP).toBeGreaterThan(expenseXP);
      });
    });
  });

  describe('getLevelFromXP', () => {
    it('should return level 1 for 0 XP', () => {
      expect(getLevelFromXP(0)).toBe(1);
    });

    it('should return level 1 for XP less than XP_PER_LEVEL', () => {
      expect(getLevelFromXP(500)).toBe(1);
      expect(getLevelFromXP(999)).toBe(1);
    });

    it('should return level 2 at exactly XP_PER_LEVEL', () => {
      expect(getLevelFromXP(XP_PER_LEVEL)).toBe(2);
    });

    it('should calculate higher levels correctly', () => {
      expect(getLevelFromXP(2000)).toBe(3);
      expect(getLevelFromXP(5000)).toBe(6);
      expect(getLevelFromXP(10000)).toBe(11);
    });

    it('should handle very high XP values', () => {
      expect(getLevelFromXP(100000)).toBe(101);
    });
  });

  describe('getXPProgress', () => {
    it('should return 0% at level start', () => {
      expect(getXPProgress(0)).toBe(0);
      expect(getXPProgress(1000)).toBe(0);
      expect(getXPProgress(2000)).toBe(0);
    });

    it('should return 50% at mid-level', () => {
      expect(getXPProgress(500)).toBe(50);
      expect(getXPProgress(1500)).toBe(50);
    });

    it('should calculate progress correctly', () => {
      expect(getXPProgress(250)).toBe(25);
      expect(getXPProgress(750)).toBe(75);
    });
  });

  describe('getLevelTitleKey', () => {
    it('should return novice_saver for levels 1-2', () => {
      expect(getLevelTitleKey(1)).toBe('novice_saver');
      expect(getLevelTitleKey(2)).toBe('novice_saver');
    });

    it('should return budget_apprentice for levels 3-5', () => {
      expect(getLevelTitleKey(3)).toBe('budget_apprentice');
      expect(getLevelTitleKey(5)).toBe('budget_apprentice');
    });

    it('should return money_manager for levels 6-10', () => {
      expect(getLevelTitleKey(6)).toBe('money_manager');
      expect(getLevelTitleKey(10)).toBe('money_manager');
    });

    it('should return legendary_investor for very high levels', () => {
      expect(getLevelTitleKey(51)).toBe('legendary_investor');
      expect(getLevelTitleKey(100)).toBe('legendary_investor');
    });
  });

  describe('calculateFinancialMood', () => {
    it('should return VERY_POSITIVE for balance > 5000', () => {
      expect(calculateFinancialMood(10000, 4000)).toBe('VERY_POSITIVE');
      expect(calculateFinancialMood(6000, 0)).toBe('VERY_POSITIVE');
    });

    it('should return POSITIVE for balance >= 1000 and <= 5000', () => {
      expect(calculateFinancialMood(5000, 0)).toBe('POSITIVE');
      expect(calculateFinancialMood(2000, 1000)).toBe('POSITIVE');
    });

    it('should return NEUTRAL for balance >= 0 and < 1000', () => {
      expect(calculateFinancialMood(500, 500)).toBe('NEUTRAL');
      expect(calculateFinancialMood(999, 0)).toBe('NEUTRAL');
    });

    it('should return NEGATIVE for balance >= -999 and < 0', () => {
      expect(calculateFinancialMood(0, 500)).toBe('NEGATIVE');
      expect(calculateFinancialMood(0, 999)).toBe('NEGATIVE');
    });

    it('should return CRITICAL for balance < -999', () => {
      expect(calculateFinancialMood(0, 1000)).toBe('CRITICAL');
      expect(calculateFinancialMood(0, 5000)).toBe('CRITICAL');
    });
  });
});
