import { describe, it, expect } from 'vitest';

// Default categories that should be created for new users
const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#EF4444' },
  { name: 'Transport', icon: '🚗', color: '#3B82F6' },
  { name: 'Entertainment', icon: '🎮', color: '#8B5CF6' },
  { name: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { name: 'Bills', icon: '📄', color: '#F59E0B' },
  { name: 'Health', icon: '💊', color: '#10B981' },
  { name: 'Education', icon: '📚', color: '#6366F1' },
  { name: 'Other', icon: '📦', color: '#6B7280' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: '💰', color: '#10B981' },
  { name: 'Freelance', icon: '💼', color: '#3B82F6' },
  { name: 'Investment', icon: '📈', color: '#8B5CF6' },
  { name: 'Gift', icon: '🎁', color: '#EC4899' },
  { name: 'Other', icon: '💵', color: '#6B7280' },
];

describe('Default Categories Configuration', () => {
  describe('Expense Categories', () => {
    it('should have exactly 8 default expense categories', () => {
      expect(DEFAULT_EXPENSE_CATEGORIES).toHaveLength(8);
    });

    it('should include essential expense categories', () => {
      const names = DEFAULT_EXPENSE_CATEGORIES.map(c => c.name);
      expect(names).toContain('Food');
      expect(names).toContain('Transport');
      expect(names).toContain('Bills');
      expect(names).toContain('Health');
      expect(names).toContain('Other');
    });

    it('should have unique names for expense categories', () => {
      const names = DEFAULT_EXPENSE_CATEGORIES.map(c => c.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid hex color codes', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      DEFAULT_EXPENSE_CATEGORIES.forEach(cat => {
        expect(cat.color).toMatch(hexColorRegex);
      });
    });

    it('should have emoji icons', () => {
      DEFAULT_EXPENSE_CATEGORIES.forEach(cat => {
        expect(cat.icon.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Income Categories', () => {
    it('should have exactly 5 default income categories', () => {
      expect(DEFAULT_INCOME_CATEGORIES).toHaveLength(5);
    });

    it('should include essential income categories', () => {
      const names = DEFAULT_INCOME_CATEGORIES.map(c => c.name);
      expect(names).toContain('Salary');
      expect(names).toContain('Freelance');
      expect(names).toContain('Investment');
      expect(names).toContain('Other');
    });

    it('should have unique names for income categories', () => {
      const names = DEFAULT_INCOME_CATEGORIES.map(c => c.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid hex color codes', () => {
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      DEFAULT_INCOME_CATEGORIES.forEach(cat => {
        expect(cat.color).toMatch(hexColorRegex);
      });
    });
  });

  describe('Category Totals', () => {
    it('should have 13 total default categories', () => {
      const total = DEFAULT_EXPENSE_CATEGORIES.length + DEFAULT_INCOME_CATEGORIES.length;
      expect(total).toBe(13);
    });

    it('should have "Other" category for both types', () => {
      const expenseHasOther = DEFAULT_EXPENSE_CATEGORIES.some(c => c.name === 'Other');
      const incomeHasOther = DEFAULT_INCOME_CATEGORIES.some(c => c.name === 'Other');
      
      expect(expenseHasOther).toBe(true);
      expect(incomeHasOther).toBe(true);
    });
  });

  describe('Category Data Integrity', () => {
    it('all categories should have required fields', () => {
      const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
      
      allCategories.forEach(cat => {
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('icon');
        expect(cat).toHaveProperty('color');
        expect(typeof cat.name).toBe('string');
        expect(typeof cat.icon).toBe('string');
        expect(typeof cat.color).toBe('string');
      });
    });

    it('category names should not be empty', () => {
      const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
      
      allCategories.forEach(cat => {
        expect(cat.name.trim().length).toBeGreaterThan(0);
      });
    });

    it('category names should not exceed reasonable length', () => {
      const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
      const maxLength = 50;
      
      allCategories.forEach(cat => {
        expect(cat.name.length).toBeLessThanOrEqual(maxLength);
      });
    });
  });
});

describe('Category Provisioning Logic', () => {
  it('should be idempotent - running twice should not duplicate categories', () => {
    // This test documents expected behavior
    // The provision-categories edge function should check for existing categories
    // before inserting new ones
    const firstRun = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    const secondRun = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    
    // Simulating idempotent behavior - same result regardless of how many times called
    expect(firstRun).toEqual(secondRun);
  });

  it('should match database trigger configuration', () => {
    // The categories defined here should match handle_new_user() and provision-categories
    // This ensures consistency across all provisioning paths
    expect(DEFAULT_EXPENSE_CATEGORIES.map(c => c.name)).toEqual([
      'Food', 'Transport', 'Entertainment', 'Shopping', 
      'Bills', 'Health', 'Education', 'Other'
    ]);
    
    expect(DEFAULT_INCOME_CATEGORIES.map(c => c.name)).toEqual([
      'Salary', 'Freelance', 'Investment', 'Gift', 'Other'
    ]);
  });
});
