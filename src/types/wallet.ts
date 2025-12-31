import { SupportedCurrency } from './database';

export type WalletType = 'checking' | 'savings' | 'credit' | 'investment' | 'cash' | 'other';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  institution: string | null;
  type: WalletType;
  currency: SupportedCurrency;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface WalletFormData {
  name: string;
  institution: string;
  type: WalletType;
  currency: SupportedCurrency;
  initial_balance: number;
  icon: string;
  color: string;
}
