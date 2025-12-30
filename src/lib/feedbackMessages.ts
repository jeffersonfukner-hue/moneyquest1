import type { TFunction } from 'i18next';

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other Income'];
const EXPENSE_CATEGORY_KEYS: Record<string, string> = {
  'Food': 'food',
  'Alimentação': 'food',
  'Comida': 'food',
  'Entertainment': 'entertainment',
  'Entretenimento': 'entertainment',
  'Shopping': 'shopping',
  'Compras': 'shopping',
  'Health': 'health',
  'Saúde': 'health',
  'Salud': 'health',
  'Transport': 'transport',
  'Transporte': 'transport',
  'Education': 'education',
  'Educação': 'education',
  'Educación': 'education',
  'Bills': 'bills',
  'Contas': 'bills',
  'Facturas': 'bills',
  'Housing': 'housing',
  'Moradia': 'housing',
  'Vivienda': 'housing',
};

export const getFeedbackMessage = (
  type: 'INCOME' | 'EXPENSE',
  category: string,
  amount: number,
  t: TFunction
): string => {
  if (type === 'INCOME') {
    // Check for large income
    if (amount >= 1000) {
      return t('feedback.income.large');
    }
    
    // Check for specific income categories
    if (category.toLowerCase().includes('salary') || category.toLowerCase().includes('salário') || category.toLowerCase().includes('salario')) {
      return t('feedback.income.salary');
    }
    
    if (category.toLowerCase().includes('freelance') || category.toLowerCase().includes('trabalho')) {
      return t('feedback.income.freelance');
    }
    
    if (category.toLowerCase().includes('invest')) {
      return t('feedback.income.investment');
    }
    
    return t('feedback.income.default');
  }
  
  // Expense messages
  const categoryKey = EXPENSE_CATEGORY_KEYS[category] || 'default';
  const translationKey = `feedback.expense.${categoryKey}`;
  
  // Check if translation exists, fallback to default
  const translated = t(translationKey);
  if (translated === translationKey) {
    return t('feedback.expense.default');
  }
  
  return translated;
};
