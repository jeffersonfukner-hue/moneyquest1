import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, X } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

interface TransactionConfirmationProps {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  currency: string;
  onDismiss: () => void;
}

export const TransactionConfirmation = ({
  type,
  category,
  amount,
  currency,
  onDismiss,
}: TransactionConfirmationProps) => {
  const { t } = useTranslation();
  const { formatCurrency } = useCurrency();
  const [isVisible, setIsVisible] = useState(true);
  
  const AUTO_DISMISS_MS = 3000;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, AUTO_DISMISS_MS);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };
  
  if (!isVisible) return null;
  
  const isIncome = type === 'INCOME';
  
  return (
    <div className={cn(
      "relative flex items-center gap-3 p-3 rounded-lg border",
      "animate-in slide-in-from-top-2 fade-in duration-200",
      isIncome 
        ? "bg-success/10 border-success/30" 
        : "bg-destructive/10 border-destructive/30"
    )}>
      <CheckCircle className={cn(
        "w-5 h-5 shrink-0",
        isIncome ? "text-success" : "text-destructive"
      )} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {t('transactionConfirmation.recorded', 'Lançamento registrado')}
        </p>
        <p className="text-xs text-muted-foreground">
          {category} • {isIncome ? '+' : '-'}{formatCurrency(amount)}
        </p>
      </div>
      
      <button
        onClick={handleDismiss}
        className="p-1 hover:bg-muted/50 rounded transition-colors"
        aria-label={t('common.close', 'Fechar')}
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
};
