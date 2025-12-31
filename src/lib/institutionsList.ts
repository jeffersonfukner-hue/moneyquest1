export interface Institution {
  name: string;
  icon: string;
  country: 'BR' | 'US' | 'EU' | 'GLOBAL';
}

export const brazilianBanks: Institution[] = [
  { name: 'Nubank', icon: '💜', country: 'BR' },
  { name: 'Banco do Brasil', icon: '🟡', country: 'BR' },
  { name: 'Itaú', icon: '🧡', country: 'BR' },
  { name: 'Bradesco', icon: '🔴', country: 'BR' },
  { name: 'Santander', icon: '🔴', country: 'BR' },
  { name: 'Caixa Econômica', icon: '🔵', country: 'BR' },
  { name: 'Inter', icon: '🟠', country: 'BR' },
  { name: 'C6 Bank', icon: '⚫', country: 'BR' },
  { name: 'PicPay', icon: '💚', country: 'BR' },
  { name: 'Mercado Pago', icon: '💙', country: 'BR' },
  { name: 'BTG Pactual', icon: '🔵', country: 'BR' },
  { name: 'XP Investimentos', icon: '⚫', country: 'BR' },
  { name: 'Rico', icon: '🟠', country: 'BR' },
  { name: 'Clear', icon: '🔵', country: 'BR' },
  { name: 'Neon', icon: '💙', country: 'BR' },
  { name: 'Next', icon: '💚', country: 'BR' },
  { name: 'Original', icon: '💚', country: 'BR' },
  { name: 'Sicoob', icon: '💚', country: 'BR' },
  { name: 'Sicredi', icon: '💚', country: 'BR' },
  { name: 'Banrisul', icon: '🔵', country: 'BR' },
];

export const internationalBanks: Institution[] = [
  { name: 'Chase', icon: '🔵', country: 'US' },
  { name: 'Bank of America', icon: '🔴', country: 'US' },
  { name: 'Wells Fargo', icon: '🔴', country: 'US' },
  { name: 'Citibank', icon: '🔵', country: 'US' },
  { name: 'Capital One', icon: '🔴', country: 'US' },
  { name: 'US Bank', icon: '🔵', country: 'US' },
  { name: 'HSBC', icon: '🔴', country: 'GLOBAL' },
  { name: 'Barclays', icon: '🔵', country: 'EU' },
  { name: 'Deutsche Bank', icon: '🔵', country: 'EU' },
  { name: 'BNP Paribas', icon: '💚', country: 'EU' },
  { name: 'Santander (Global)', icon: '🔴', country: 'GLOBAL' },
  { name: 'ING', icon: '🟠', country: 'EU' },
];

export const fintechs: Institution[] = [
  { name: 'Wise', icon: '💚', country: 'GLOBAL' },
  { name: 'Revolut', icon: '💜', country: 'GLOBAL' },
  { name: 'N26', icon: '💚', country: 'EU' },
  { name: 'PayPal', icon: '🔵', country: 'GLOBAL' },
  { name: 'Venmo', icon: '🔵', country: 'US' },
  { name: 'Cash App', icon: '💚', country: 'US' },
  { name: 'Chime', icon: '💚', country: 'US' },
  { name: 'Monzo', icon: '🔴', country: 'EU' },
  { name: 'Starling', icon: '💜', country: 'EU' },
];

export const allInstitutions: Institution[] = [
  ...brazilianBanks,
  ...internationalBanks,
  ...fintechs,
];

export const walletTypeIcons: Record<string, string> = {
  checking: '🏦',
  savings: '🐷',
  credit: '💳',
  investment: '📈',
  cash: '💵',
  other: '💰',
};

export const walletTypeColors: Record<string, string> = {
  checking: '#3B82F6',
  savings: '#10B981',
  credit: '#EF4444',
  investment: '#8B5CF6',
  cash: '#F59E0B',
  other: '#6B7280',
};
